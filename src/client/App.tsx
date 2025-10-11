import { useState, useEffect } from 'react';
import type { Status } from '../shared/async';
import type { Transaction } from '../shared/transaction';
import type { AccountBalance } from '../shared/account';
import type { Api } from './api-client/interface';
import { TransactionList } from './components/TransactionList';
import { BalanceCards } from './components/BalanceCards';
import TransactionFilters from './components/TransactionFilters';
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
        // Handle Result types
        if (txResult.tag === 'error') {
          const errMsg = txResult.error.tag === 'BadRequest'
            ? txResult.error.reason
            : 'Failed to load transactions';
          setFinancialData({ kind: 'Error', error: errMsg });
          return;
        }

        if (balResult.tag === 'error') {
          const errMsg = balResult.error.tag === 'BadRequest'
            ? balResult.error.reason
            : 'Failed to load balances';
          setFinancialData({ kind: 'Error', error: errMsg });
          return;
        }

        setFinancialData({
          kind: 'Loaded',
          transactions: txResult.value,
          balances: balResult.value,
        });
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
            const _exhaustive: never = financialData;
            return _exhaustive;
          }
        }
      })()}
    </div>
  );
}

export default App;
