// Balance query handlers - read operations only
import type { AccountBalance } from '../../../shared/account';
import type { BalanceRepo } from '../../repos/balance/interface';

export type BalanceQuery = {
  getBalances(budgetId: number): Promise<AccountBalance[]>;
};

const init = (repo: BalanceRepo): BalanceQuery => {
  const getBalances = (
    budgetId: number
  ): Promise<AccountBalance[]> => {
    return repo.getBalances(budgetId);
  };

  return {
    getBalances
  };
};

export const BalanceQuery = { init } as const;
