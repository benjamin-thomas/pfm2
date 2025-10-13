// Balance query handlers - read operations only
import type { AccountBalance } from '../../../shared/account';
import type { BalanceRepo } from '../../repos/balance/interface';

export type BalanceQuery = {
  getBalances(): Promise<AccountBalance[]>;
};

const init = (repo: BalanceRepo): BalanceQuery => {
  const getBalances = (): Promise<AccountBalance[]> => {
    return repo.getBalances();
  };

  return {
    getBalances
  };
};

export const BalanceQuery = { init } as const;
