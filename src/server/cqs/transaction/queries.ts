// Transaction query handlers - read operations only
import type { Transaction, TransactionFilters, PaginationParams, PaginatedResponse } from '../../../shared/transaction';
import type { TransactionRepo } from '../../repos/transaction/interface';
import type { Maybe } from '../../../shared/utils/maybe';

// No business rules - just pass through
const list = (
  repo: TransactionRepo,
  filters: Maybe<TransactionFilters>,
  pagination: Maybe<PaginationParams>
): Promise<PaginatedResponse<Transaction>> => {
  return repo.list(filters, pagination);
};

const listByBudget = (
  repo: TransactionRepo,
  budgetId: number
): Promise<Transaction[]> => {
  return repo.listByBudget(budgetId);
};

const findById = (
  repo: TransactionRepo,
  id: number
): Promise<Maybe<Transaction>> => {
  return repo.findById(id);
};

export const TransactionQuery = {
  list,
  listByBudget,
  findById
} as const;
