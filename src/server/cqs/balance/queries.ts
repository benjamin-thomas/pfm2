// Balance query handlers - read operations only
import type { AccountBalance } from '../../../shared/account';
import type { BalanceRepo } from '../../repos/balance/interface';

const getBalances = (
  repo: BalanceRepo,
  budgetId: number
): Promise<AccountBalance[]> => {
  return repo.getBalances(budgetId);
};

export const BalanceQuery = {
  getBalances
} as const;
