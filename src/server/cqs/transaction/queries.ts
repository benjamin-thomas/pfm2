// Transaction query handlers - read operations only
import type { PaginatedResponse, PaginationParams, Transaction, TransactionFilters } from '../../../shared/transaction';
import type { Maybe } from '../../../shared/utils/maybe';
import type { TransactionRepo } from '../../repos/transaction/interface';

export type TransactionQuery = {
  list(filters: Maybe<TransactionFilters>, pagination: Maybe<PaginationParams>): Promise<PaginatedResponse<Transaction>>;
  listByBudget(budgetId: number): Promise<Transaction[]>;
  findById(id: number): Promise<Maybe<Transaction>>;
};

const init = (repo: TransactionRepo): TransactionQuery => {
  const list = (
    filters: Maybe<TransactionFilters>,
    pagination: Maybe<PaginationParams>
  ): Promise<PaginatedResponse<Transaction>> => {
    return repo.list(filters, pagination);
  };

  const listByBudget = (
    budgetId: number
  ): Promise<Transaction[]> => {
    return repo.listByBudget(budgetId);
  };

  const findById = (
    id: number
  ): Promise<Maybe<Transaction>> => {
    return repo.findById(id);
  };

  return {
    list,
    listByBudget,
    findById
  };
};

export const TransactionQuery = { init } as const;
