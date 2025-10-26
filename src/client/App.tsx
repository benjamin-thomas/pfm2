import { useCallback, useEffect, useState } from 'react';
import type { Account, AccountBalance } from '../shared/account';
import type { Status } from '../shared/async';
import type { LedgerEntry } from '../shared/ledger';
import { isUnknownAccount } from '../shared/utils/accounts';
import { impossibleBranch } from '../shared/utils/impossibleBranch';
import { Maybe } from '../shared/utils/maybe';
import { Result } from '../shared/utils/result';
import type { Api, ApiError } from './api-client/interface';
import { BalanceCards } from './components/BalanceCards';
import TransactionFilters from './components/TransactionFilters';
import { TransactionList } from './components/TransactionList';
import { type ModalMode, type TransactionData, TransactionModal } from './components/TransactionModal';
import './App.css';
import './components/Buttons.css';
import type { Transaction } from "../shared/transaction.ts";

type FinancialData = {
  ledgerEntries: LedgerEntry[];
  balances: AccountBalance[];
  accounts: Account[];
};

type AppProps = {
  api: Api;
  selectedAccountId: number;
  setSelectedAccountId: (accountId: number) => void;
};

type SearchFilters = {
  description: string;
  minAmount: string;
  maxAmount: string;
  unknownExpenses: boolean;
};

const App = ({ api, selectedAccountId, setSelectedAccountId }: AppProps) => {
  const [financialData, setFinancialData] = useState<Status<FinancialData>>({ kind: 'Loading' });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [filters, setFilters] = useState<SearchFilters>({
    description: '',
    minAmount: '',
    maxAmount: '',
    unknownExpenses: false,
  });
  const [modalMode, setModalMode] = useState<Maybe<ModalMode>>(Maybe.nothing);
  const [saveError, setSaveError] = useState<Maybe<string>>(Maybe.nothing);

  const fetchFinancialData = useCallback((accountId: number, accounts: Account[]) => {
    Promise.all([
      api.ledger.getLedgerForAccount(accountId),
      api.balances.getBalances(),
    ])
      .then(([ledgerResult, balResult]) => {
        Result.match(
          ledgerResult,
          (error) => {
            const errMsg = error.tag === 'BadRequest'
              ? error.reason
              : 'Failed to load ledger';
            setFinancialData({ kind: 'Error', error: errMsg });
          },
          (ledgerEntries) => {
            Result.match(
              balResult,
              (error) => {
                const errMsg = error.tag === 'BadRequest'
                  ? error.reason
                  : 'Failed to load balances';
                setFinancialData({ kind: 'Error', error: errMsg });
              },
              (balances) => {
                // TODO: ugly, probably do this once, in AppWithRouter
                if (selectedAccountId === 0 && balances.length > 0) {
                  const firstAccountId = balances[0].accountId;
                  setSelectedAccountId(firstAccountId);
                }

                setFinancialData({
                  kind: 'Loaded',
                  ledgerEntries,
                  balances,
                  accounts,
                });
              }
            );
          }
        );
      })
      .catch(err => setFinancialData({ kind: 'Error', error: err?.message || 'Unknown error' }));
  }, [selectedAccountId, setSelectedAccountId, api.ledger, api.balances]);

  useEffect(() => {
    // Fetch accounts for validation and UI
    api.accounts.list()
      .then(accountsResult => {
        Result.match(
          accountsResult,
          (error) => {
            const errMsg = error.tag === 'BadRequest'
              ? error.reason
              : 'Failed to load accounts';
            setFinancialData({ kind: 'Error', error: errMsg });
          },
          (accounts) => {
            // Assert: Must have Unknown_EXPENSE and Unknown_INCOME accounts (core app requirements)
            const unknownExpense = accounts.find(acc => acc.name === 'Unknown_EXPENSE');
            const unknownIncome = accounts.find(acc => acc.name === 'Unknown_INCOME');

            if (!unknownExpense) {
              throw new Error('Data integrity error: Unknown_EXPENSE account not found');
            }
            if (!unknownIncome) {
              throw new Error('Data integrity error: Unknown_INCOME account not found');
            }

            // Fetch ledger and balances for the selected account (not overriding selection)
            fetchFinancialData(selectedAccountId, accounts);
          }
        );
      })
      .catch(err => setFinancialData({ kind: 'Error', error: err?.message || 'Unknown error' }));
  }, [api, fetchFinancialData, selectedAccountId]);

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="container">
      <h1>PFM2 - Personal Finance Manager</h1>

      {/* Dark Mode Toggle */}
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? "🌙" : "☀️"}
      </button>

      {(() => {
        switch (financialData.kind) {
          case 'Loading': {
            return (
              <div className="section">
                <div>Loading financial data...</div>
              </div>
            );
          }

          case 'Error': {
            return (
              <div className="section">
                <div>Error loading financial data: {financialData.error}</div>
              </div>
            );
          }

          case 'Loaded': {
            const { balances, ledgerEntries, accounts } = financialData;

            // Sanity check: must have valid selected account
            const selectedAccount = accounts.find(a => a.accountId === selectedAccountId);
            if (!selectedAccount) {
              throw new Error(`Data integrity error: Selected account ${selectedAccountId} not found`);
            }

            // Extract unknown accounts (validated at startup)
            const unknownExpense = accounts.find(acc => acc.name === 'Unknown_EXPENSE');
            const unknownIncome = accounts.find(acc => acc.name === 'Unknown_INCOME');

            if (!unknownExpense || !unknownIncome) {
              throw new Error('Data integrity error: Unknown accounts must exist');
            }

            // Filter ledger entries based on search criteria
            const filteredLedgerEntries = ledgerEntries.filter((entry) => {
              // Description filter (case-insensitive)
              if (filters.description && !entry.descr.toLowerCase().includes(filters.description.toLowerCase())) {
                return false;
              }

              // Min amount filter (convert cents to euros for comparison)
              if (filters.minAmount) {
                const minCents = Math.round(parseFloat(filters.minAmount) * 100);
                if (!Number.isNaN(minCents) && entry.cents < minCents) {
                  return false;
                }
              }

              // Max amount filter
              if (filters.maxAmount) {
                const maxCents = Math.round(parseFloat(filters.maxAmount) * 100);
                if (!Number.isNaN(maxCents) && entry.cents > maxCents) {
                  return false;
                }
              }

              // Unknown expenses filter - check account names instead of IDs
              return !(filters.unknownExpenses && !isUnknownAccount(entry.toAccountName));
            });

            const handleClearFilters = () => {
              setFilters({
                description: '',
                minAmount: '',
                maxAmount: '',
                unknownExpenses: false,
              });
            };

            return (
              <>
                {Maybe.match(modalMode,
                  () => null,
                  (mode) => {
                    const clickedSave = (formData: TransactionData) => {
                      // Determine which API call to make based on mode
                      const save: () => (Promise<Result<ApiError, Transaction>>) = () => {
                        switch (mode.kind) {
                          case 'add':
                            // Simulate a server error easily (keep this for a bit)
                            // return Promise.resolve(Result.err({ tag: 'BadRequest', reason: `Simulated server error ${Math.random()}` }));  
                            return api.transactions.create(formData);
                          case 'edit':
                            return api.transactions.update(mode.transaction.transactionId, formData);
                          default:
                            return impossibleBranch(mode);
                        }
                      };

                      save().then(result => {
                        Result.match(
                          result,
                          (error) => {
                            // Set error to display in modal
                            const errMsg = error.tag === 'BadRequest' ? error.reason : `Failed to save: ${error.tag}`;
                            setSaveError(Maybe.just(errMsg));
                          },
                          () => {
                            // On success, close modal and refetch data
                            setModalMode(Maybe.nothing);
                            setSaveError(Maybe.nothing);

                            // Reload accounts and financial data after successful transaction creation
                            api.accounts.list()
                              .then(accountsResult => {
                                Result.match(
                                  accountsResult,
                                  (error) => {
                                    const errMsg = error.tag === 'BadRequest'
                                      ? error.reason
                                      : 'Failed to load accounts';
                                    setFinancialData({ kind: 'Error', error: errMsg });
                                  },
                                  (accounts) => {
                                    // Reload financial data with updated transactions
                                    fetchFinancialData(selectedAccountId, accounts);
                                  }
                                );
                              })
                              .catch(err => setFinancialData({ kind: 'Error', error: err?.message || 'Unknown error' }));
                          }
                        );
                      });
                    };

                    return (
                      <TransactionModal
                        clickedCancel={() => {
                          setModalMode(Maybe.nothing);
                          setSaveError(Maybe.nothing);
                        }}
                        clickedSave={clickedSave}
                        saveError={saveError}
                        formChanged={() => setSaveError(Maybe.nothing)}
                        accounts={accounts}
                        mode={mode}
                      />
                    )
                  }
                )}

                <div className="section">
                  <BalanceCards
                    balances={balances}
                    selectedAccountId={selectedAccountId}
                    onSelectAccount={setSelectedAccountId}
                  />
                </div>

                <div className="section">
                  <div className="transaction-list">
                    <div className="transaction-list__header">
                      <div className="transaction-list__header-title">
                        <h3>Transactions</h3>
                        <span className="transaction-count">
                          {filteredLedgerEntries.length} of {ledgerEntries.length} transactions
                        </span>
                      </div>

                      <div className="transaction-list__header-buttons">
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => setModalMode(Maybe.just({ kind: 'add', defaultFromAccountId: selectedAccountId, defaultToAccountId: unknownExpense.accountId }))}
                          data-testid="add-transaction-button"
                        >
                          Add Transaction
                        </button>
                      </div>
                    </div>
                    <TransactionFilters
                      description={filters.description}
                      minAmount={filters.minAmount}
                      maxAmount={filters.maxAmount}
                      unknownExpenses={filters.unknownExpenses}
                      onDescriptionChange={(value) => setFilters({ ...filters, description: value })}
                      onMinAmountChange={(value) => setFilters({ ...filters, minAmount: value })}
                      onMaxAmountChange={(value) => setFilters({ ...filters, maxAmount: value })}
                      onUnknownExpensesChange={(value) => setFilters({ ...filters, unknownExpenses: value })}
                      onClear={handleClearFilters}
                    />
                    <TransactionList
                      transactions={filteredLedgerEntries}
                      selectedAccountName={selectedAccount.name}
                      onTransactionSelect={(transaction) => setModalMode(Maybe.just({ kind: 'edit', transaction }))}
                    />
                  </div>
                </div>
              </>
            );
          }

          /* v8 ignore next 2 */
          default:
            return impossibleBranch(financialData);
        }
      })()}
    </div>
  );
}

export default App;
