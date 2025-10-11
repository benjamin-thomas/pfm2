// Balance query handlers - read operations only
//
// DESIGN NOTES:
// - Queries accept typed inputs (validation done at HTTP/CLI layer)
// - Balance repo is read-only (balances are calculated from transactions)
// - No business rules - just pass through
//
import type { AccountBalance } from '../../../shared/account';
import type { BalanceRepo } from '../../repos/balance/interface';

export const getBalances = (
  repo: BalanceRepo,
  budgetId: number
): Promise<AccountBalance[]> => {
  return repo.getBalances(budgetId);
};
