// Transaction query handlers - read operations only
//
// DESIGN NOTES:
// - Queries accept typed inputs (validation done at HTTP/CLI layer)
// - Queries return Result<DomainError, T> ONLY when business rules can fail
// - Queries are thin wrappers for simple cases, but valuable for:
//   - Aggregate roots (joining data from multiple repos)
//   - Access control (filtering based on permissions)
//   - Complex filtering/sorting logic
// - Queries throw on unexpected errors (DB down, network failure)
// - Not found returns Option.none (not an error)
//
import type { Transaction, TransactionFilters, PaginationParams, PaginatedResponse } from '../../../shared/transaction';
import type { TransactionRepo } from '../../repos/transaction/interface';
import type { Option } from '../../../shared/utils/option';

// No business rules - just pass through
export const list = (
  repo: TransactionRepo,
  filters: Option<TransactionFilters>,
  pagination: Option<PaginationParams>
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
): Promise<Option<Transaction>> => {
  return repo.findById(id);
};
