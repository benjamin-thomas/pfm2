// Transaction repository interface - behavioral contract

import type {
  Transaction,
  NewTransaction,
  UpdateTransaction,
  TransactionFilters,
  PaginationParams,
  PaginatedResponse,
} from '../../../shared/transaction';
import type { Option } from '../../../shared/utils/option';

export type AffectedRows = { affectedRows: number };

export interface TransactionRepo {
  // Create
  create(transaction: NewTransaction): Promise<Transaction>;

  // Read
  findById(id: number): Promise<Option<Transaction>>;
  list(filters: Option<TransactionFilters>, pagination: Option<PaginationParams>): Promise<PaginatedResponse<Transaction>>;
  listByBudget(budgetId: number): Promise<Transaction[]>;
  listByAccount(accountId: number): Promise<Transaction[]>;

  // Update
  update(id: number, updates: UpdateTransaction): Promise<AffectedRows>;

  // Delete
  remove(id: number): Promise<AffectedRows>;

  // Bulk operations
  createMany(transactions: NewTransaction[]): Promise<Transaction[]>;
  removeMany(ids: number[]): Promise<number>; // Returns count deleted
}
