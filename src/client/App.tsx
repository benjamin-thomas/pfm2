import { useState, useEffect } from 'react';
import type { Status } from '../shared/async';
import type { Transaction } from '../shared/transaction';
import type { AccountBalance } from '../shared/account';
import type { Api } from './api-client/interface';
import { TransactionList } from './components/TransactionList';
import { BalanceCards } from './components/BalanceCards';
import TransactionFilters from './components/TransactionFilters';
import { Result } from '../shared/utils/result';
import './App.css';
import './components/Buttons.css';

type FinancialData = {
  transactions: Transaction[];
  balances: AccountBalance[];
};

type AppProps = {
  api: Api;
};

function App({ api }: AppProps) {
  const [financialData, setFinancialData] = useState<Status<FinancialData>>({ kind: 'Loading' });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    // Fetch transactions and balances using the API
    Promise.all([
      api.transactions.list({ budgetId: 1 }),
      api.balances.getBalances({ budgetId: 1 }),
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

  return (
    <div className="container">
      <h1>PFM2 - Personal Finance Manager</h1>

      {/* Dark Mode Toggle */}
      <button
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
            const { balances, transactions } = financialData;

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
                          {transactions.length} transactions
                        </span>
                      </div>

                      <div className="transaction-list__header-buttons">
                        <button className="button">
                          💡 Apply All Suggestions
                        </button>
                        <button className="button button--primary">
                          Add Transaction
                        </button>
                      </div>
                    </div>
                    <TransactionFilters />
                    <TransactionList transactions={transactions} />
                  </div>
                </div>
              </>
            );
          }

          default: {
            const exhaustive: never = financialData;
            throw new Error(`Impossible: ${exhaustive}`);
          }
        }
      })()}
    </div>
  );
}

export default App;
