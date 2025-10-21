import { useCallback, useEffect, useState } from 'react';
import type { AccountBalance } from '../shared/account';
import type { Status } from '../shared/async';
import type { Transaction } from '../shared/transaction';
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
  transactions: Transaction[];
  balances: AccountBalance[];
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

  useEffect(() => {
    // Fetch transactions and balances using the API
    Promise.all([
      api.transactions.list({ searchTerm: '' }),
      api.balances.getBalances(),
    ])
      .then(([txResult, balResult]) => {
        // Handle Result types with Result.match
        Result.match(
          txResult,
          (error) => {
            const errMsg = error.tag === 'BadRequest'
              ? error.reason
              : 'Failed to load transactions';
            setFinancialData({ kind: 'Error', error: errMsg });
          },
          (transactions) => {
            Result.match(
              balResult,
              (error) => {
                const errMsg = error.tag === 'BadRequest'
                  ? error.reason
                  : 'Failed to load balances';
                setFinancialData({ kind: 'Error', error: errMsg });
              },
              (balances) => {
                setFinancialData({
                  kind: 'Loaded',
                  transactions,
                  balances,
                });
              }
            );
          }
        );
      })
      .catch(err => setFinancialData({ kind: 'Error', error: err.message }));
  }, [api]);

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
        // Success - re-fetch transactions and balances
        Promise.all([
          api.transactions.list({ searchTerm: '' }),
          api.balances.getBalances(),
        ])
          .then(([txResult, balResult]) => {
            Result.match(
              txResult,
              (error) => {
                const errMsg = error.tag === 'BadRequest'
                  ? error.reason
                  : 'Failed to load transactions';
                setFinancialData({ kind: 'Error', error: errMsg });
              },
              (transactions) => {
                Result.match(
                  balResult,
                  (error) => {
                    const errMsg = error.tag === 'BadRequest'
                      ? error.reason
                      : 'Failed to load balances';
                    setFinancialData({ kind: 'Error', error: errMsg });
                  },
                  (balances) => {
                    setFinancialData({
                      kind: 'Loaded',
                      transactions,
                      balances,
                    });
                    setIsModalOpen(false);
                  }
                );
              }
            );
          });
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

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={
          // Give "stable ref" to handleClose
          useCallback(() => setIsModalOpen(false), [])}
        onSubmit={handleAddTransaction}
      />

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
            const { balances, transactions } = financialData;

            // Filter transactions based on search criteria
            const filteredTransactions = transactions.filter((tx) => {
              // Description filter (case-insensitive)
              if (filters.description && !tx.descr.toLowerCase().includes(filters.description.toLowerCase())) {
                return false;
              }

              // Min amount filter (convert cents to euros for comparison)
              if (filters.minAmount) {
                const minCents = Math.round(parseFloat(filters.minAmount) * 100);
                if (!Number.isNaN(minCents) && tx.cents < minCents) {
                  return false;
                }
              }

              // Max amount filter
              if (filters.maxAmount) {
                const maxCents = Math.round(parseFloat(filters.maxAmount) * 100);
                if (!Number.isNaN(maxCents) && tx.cents > maxCents) {
                  return false;
                }
              }

              // Unknown expenses filter (toAccountId === 6 means Unknown_EXPENSE)
              if (filters.unknownExpenses && tx.toAccountId !== 6) {
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
                <div className="section">
                  <BalanceCards balances={balances} />
                </div>

                <div className="section">
                  <div className="transaction-list">
                    <div className="transaction-list__header">
                      <div className="transaction-list__header-title">
                        <h3>Transactions</h3>
                        <span className="transaction-count">
                          {filteredTransactions.length} of {transactions.length} transactions
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
                    <TransactionList transactions={filteredTransactions} />
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
