import type React from 'react';
import type { AccountBalance } from '../../shared/account';
import { BalanceCard } from './BalanceCard';
import './BalanceCards.css';

type BalanceCardsProps = {
  balances: AccountBalance[];
  selectedAccountId: number;
  onSelectAccount: (accountId: number) => void;
};

export const BalanceCards: React.FC<BalanceCardsProps> = ({ balances, selectedAccountId, onSelectAccount }) => {
  return (
    <div>
      <h2 className="section-title">Balances</h2>
      <div className="balances">
        {balances.map((balance) => (
          <BalanceCard
            key={balance.accountId}
            balance={balance}
            isSelected={balance.accountId === selectedAccountId}
            onClick={() => onSelectAccount(balance.accountId)}
          />
        ))}
      </div>
    </div>
  );
};