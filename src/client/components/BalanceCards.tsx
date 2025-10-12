import type React from 'react';
import type { AccountBalance } from '../../shared/account';
import { BalanceCard } from './BalanceCard';
import './BalanceCards.css';

type BalanceCardsProps = {
  balances: AccountBalance[];
};

export const BalanceCards: React.FC<BalanceCardsProps> = ({ balances }) => {
  return (
    <div>
      <h2 className="section-title">Balances</h2>
      <div className="balances">
        {balances.map((balance) => (
          <BalanceCard key={balance.accountId} balance={balance} />
        ))}
      </div>
    </div>
  );
};