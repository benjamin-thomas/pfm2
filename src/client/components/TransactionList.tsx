import type { LedgerEntry } from '../../shared/ledger';
import { formatDate, formatMoney } from '../../shared/money';
import './TransactionList.css';

type TransactionListProps = {
  transactions: LedgerEntry[];
  selectedAccountName: string;
};

export const TransactionList = ({ transactions, selectedAccountName }: TransactionListProps) => {
  if (transactions.length === 0) {
    return <div className="empty">No transactions found for {selectedAccountName}.</div>;
  }

  return (
    <ul className="transaction-list__items">
      {transactions.map((entry) => {
        // Use flowCents to determine if money is coming in (+) or going out (-)
        const isPositive = entry.flowCents > 0;
        const amountClass = isPositive
          ? 'transaction-item__amount--positive'
          : 'transaction-item__amount--negative';

        return (
          <li
            key={entry.transactionId}
            className="transaction-item"
            data-test--balance-before={entry.priorBalanceCents}
            data-test--balance-after={entry.runningBalanceCents}
          >
            <div className="transaction-item__row">
              <div className="transaction-item__main-content">
                <div className="transaction-item__details">
                  <div className="transaction-item__description">
                    {entry.descr}
                  </div>
                  <div className="transaction-item__accounts">
                    {entry.fromAccountName} → {entry.toAccountName}
                  </div>
                </div>
                <div className="transaction-item__date">
                  {formatDate(entry.date)}
                </div>
              </div>
              <div
                className={`transaction-item__amount ${amountClass}`}
                data-test--amount={entry.cents}
              >
                {isPositive ? '+' : '-'}{formatMoney(entry.cents)}
              </div>
              <div className="transaction-item__balance-column">
                <div className="transaction-item__balance-movement">
                  <span className="balance-before">
                    {formatMoney(entry.priorBalanceCents)}
                  </span>
                  <span className="arrow-icon">→</span>
                  <span className={`balance-after ${entry.runningBalanceCents < 0 ? 'balance-after--negative' : ''}`}>
                    {formatMoney(entry.runningBalanceCents)}
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
