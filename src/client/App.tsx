import { useCallback, useEffect, useState } from 'react';
import type { Account, AccountBalance } from '../shared/account';
import type { Status } from '../shared/async';
import type { LedgerEntry } from '../shared/ledger';
import { isUnknownAccount } from '../shared/utils/accounts';
import { impossibleBranch } from '../shared/utils/impossibleBranch';
import { Result } from '../shared/utils/result';
import type { Api } from './api-client/interface';
import { AddTransactionModal, type NewTransactionData } from './components/AddTransactionModal';
import { BalanceCards } from './components/BalanceCards';
import TransactionFilters from './components/TransactionFilters';
import { TransactionList } from './components/TransactionList';
import './App.css';
import './components/Buttons.css';

type FinancialData = {
  ledgerEntries: LedgerEntry[];
  balances: AccountBalance[];
  accounts: Account[];
};

type AppProps = {
  api: Api;
};

type SearchFilters = {
  description: string;
  minAmount: string;
  maxAmount: string;
  unknownExpenses: boolean;
};

function App({ api }: AppProps) {
  const [financialData, setFinancialData] = useState<Status<FinancialData>>({ kind: 'Loading' });

  // Read selected account from URL query param, default to 0 if not present
  const params = new URLSearchParams(window.location.search);
  const accountIdFromUrl = params.get('account');
  const [selectedAccountId, setSelectedAccountId] = useState<number>(
    accountIdFromUrl ? parseInt(accountIdFromUrl, 10) : 0
  );
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to create URL with account query param
  const newUrlWithAccount = useCallback((accountId: number) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('account', accountId.toString());
    return newUrl;
  }, []);

  useEffect(() => {
    const fetchFinancialData = (accountId: number, accounts: Account[]) => {
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
                  // If no account selected and we have balances, select the first one
                  if (selectedAccountId === 0 && balances.length > 0) {
                    const firstAccountId = balances[0].accountId;
                    setSelectedAccountId(firstAccountId);
                    window.history.replaceState({}, '', newUrlWithAccount(firstAccountId));
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
    };


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
  }, [api, selectedAccountId, newUrlWithAccount]);

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

  const handleAddTransaction = async (transactionData: NewTransactionData) => {
    const result = await api.transactions.create(transactionData);

    Result.match(
      result,
      (error) => {
        const errMsg = error.tag === 'BadRequest'
          ? error.reason
          : 'Failed to create transaction';
        setFinancialData({ kind: 'Error', error: errMsg });
      },
      () => {
        // Success - re-fetch data
        // if (selectedAccountId === 0) {
        //   throw new Error('Programming error: selectedAccountId should never be 0 when adding a transaction');
        // }

        // Re-fetch accounts in case new accounts were implicitly created
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
                setSelectedAccountId(accounts[0].accountId);
                setIsModalOpen(false);
              }
            );
          })
          .catch(err => setFinancialData({ kind: 'Error', error: err?.message || 'Unknown error' }));
      }
    );
  };

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
              if (filters.unknownExpenses && !isUnknownAccount(entry.toAccountName)) {
                return false;
              }

              return true;
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
                <AddTransactionModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSubmit={handleAddTransaction}
                  accounts={accounts}
                  defaultFromAccountId={selectedAccountId}
                  defaultToAccountId={unknownExpense.accountId}
                />

                <div className="section">
                  <BalanceCards
                    balances={balances}
                    selectedAccountId={selectedAccountId}
                    onSelectAccount={(accountId) => {
                      setSelectedAccountId(accountId);
                      window.history.pushState({}, '', newUrlWithAccount(accountId));
                    }}
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
                          onClick={() => setIsModalOpen(true)}
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
