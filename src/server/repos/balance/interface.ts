import type { AccountBalance } from '../../../shared/account';

export interface BalanceRepo {
  getBalances(budgetId: number): Promise<AccountBalance[]>;
}
