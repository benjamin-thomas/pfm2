// Transaction repository interface - behavioral contract

import type {
  Transaction,
  NewTransaction,
  UpdateTransaction,
  TransactionFilters,
  PaginationParams,
  PaginatedResponse,
} from '../../../shared/transaction';
import type { Maybe } from '../../../shared/utils/maybe';

export type AffectedRows = { affectedRows: number };

export interface TransactionRepo {
  // Create
  create(transaction: NewTransaction): Promise<Transaction>;

  // Read
  findById(id: number): Promise<Maybe<Transaction>>;
  list(filters: Maybe<TransactionFilters>, pagination: Maybe<PaginationParams>): Promise<PaginatedResponse<Transaction>>;
  listByBudget(budgetId: number): Promise<Transaction[]>;
  listByAccount(accountId: number): Promise<Transaction[]>;

  // Update
  update(id: number, updates: UpdateTransaction): Promise<AffectedRows>;

  // Delete
  delete(id: number): Promise<AffectedRows>;

  // Bulk operations
  createMany(transactions: NewTransaction[]): Promise<Transaction[]>;
  deleteMany(ids: number[]): Promise<number>; // Returns count deleted
}
