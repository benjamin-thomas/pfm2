// Transaction repository interface - behavioral contract

import type {
  Transaction,
  NewTransaction,
  UpdateTransaction,
  TransactionFilters,
  PaginationParams,
  PaginatedResponse,
} from '../../shared/transaction';

export interface TransactionRepo {
  // Create
  create(transaction: NewTransaction): Promise<Transaction>;

  // Read
  findByIdOrNull(id: number): Promise<Transaction | null>;
  list(filters?: TransactionFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Transaction>>;
  listByBudget(budgetId: number): Promise<Transaction[]>;
  listByAccount(accountId: number): Promise<Transaction[]>;

  // Update
  updateOrThrow(id: number, updates: UpdateTransaction): Promise<Transaction>;

  // Delete
  delete(id: number): Promise<boolean>;

  // Bulk operations
  createMany(transactions: NewTransaction[]): Promise<Transaction[]>;
  deleteMany(ids: number[]): Promise<number>; // Returns count deleted
}
