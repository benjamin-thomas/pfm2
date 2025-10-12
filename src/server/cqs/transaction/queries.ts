// Transaction query handlers - read operations only
import type { Transaction, TransactionFilters, PaginationParams, PaginatedResponse } from '../../../shared/transaction';
import type { TransactionRepo } from '../../repos/transaction/interface';
import type { Maybe } from '../../../shared/utils/maybe';

// No business rules - just pass through
export const list = (
  repo: TransactionRepo,
  filters: Maybe<TransactionFilters>,
  pagination: Maybe<PaginationParams>
): Promise<PaginatedResponse<Transaction>> => {
  return repo.list(filters, pagination);
};

export const listByBudget = (
  repo: TransactionRepo,
  budgetId: number
): Promise<Transaction[]> => {
  return repo.listByBudget(budgetId);
};

export const findById = (
  repo: TransactionRepo,
  id: number
): Promise<Maybe<Transaction>> => {
  return repo.findById(id);
};
