import { formatDate, formatMoney } from '../../shared/money';
import type { Transaction } from '../../shared/transaction';
import './TransactionList.css';

type TransactionListProps = {
  transactions: Transaction[];
};

// Account names mapping (from SQL init)
const accountNames: Record<number, string> = {
  1: 'OpeningBalance',
  2: 'Checking account',
  3: 'Savings account',
  4: 'Unknown_INCOME',
  5: 'Employer',
  6: 'Unknown_EXPENSE',
  7: 'Groceries',
  8: 'Communications',
  9: 'Transport',
  10: 'Health',
  11: 'Energy',
  12: 'Clothing',
  13: 'Leisure',
};

export const TransactionList = ({ transactions }: TransactionListProps) => {
  if (transactions.length === 0) {
    return <div className="empty">No transactions found.</div>;
  }

  return (
    <ul className="transaction-list__items">
      {transactions.map((transaction) => {
        const isPositive = transaction.fromAccountId === 5; // Employer = income
        const amountClass = isPositive
          ? 'transaction-item__amount--positive'
          : 'transaction-item__amount--negative';

        return (
          <li key={transaction.transactionId} className="transaction-item">
            <div className="transaction-item__row">
              <div className="transaction-item__main-content">
                <div className="transaction-item__details">
                  <div className="transaction-item__description">
                    {transaction.descr}
                  </div>
                  <div className="transaction-item__accounts">
                    {accountNames[transaction.fromAccountId] || `Account ${transaction.fromAccountId}`} → {accountNames[transaction.toAccountId] || `Account ${transaction.toAccountId}`}
                  </div>
                </div>
                <div className="transaction-item__date">
                  {formatDate(transaction.date)}
                </div>
              </div>
              <div className={`transaction-item__amount ${amountClass}`}>
                {isPositive ? '+' : '-'}{formatMoney(transaction.cents)}
              </div>
              <div className="transaction-item__balance-column">
                <div className="transaction-item__balance-movement">
                  <span className="balance-before">123.00 €</span>
                  <span className="arrow-icon">→</span>
                  <span className="balance-after">124.00 €</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
