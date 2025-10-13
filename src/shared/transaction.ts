// Transaction domain types

export type Transaction = {
  transactionId: number;
  fromAccountId: number;
  toAccountId: number;
  date: number; // Unix timestamp
  descr: string;
  cents: number;
  createdAt: number;
  updatedAt: number;
};

export type NewTransaction = Omit<Transaction, 'transactionId' | 'createdAt' | 'updatedAt'>;

export type UpdateTransaction = Omit<Transaction, 'transactionId' | 'createdAt' | 'updatedAt'>;

// View model with joined account/category names
export type TransactionView = Transaction & {
  fromAccountName: string;
  toAccountName: string;
  fromCategoryName: string;
  toCategoryName: string;
  amountFormatted: string;
};

// Query filters
export type TransactionFilters = {
  fromAccountId?: number;
  toAccountId?: number;
  startDate?: number;
  endDate?: number;
  search?: string;
};

// Pagination
export type PaginationParams = {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
