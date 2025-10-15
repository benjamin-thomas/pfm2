// Transaction domain types
import { array, fields, number, string } from 'tiny-decoders';

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

// Codecs for runtime validation
export const transactionCodec = fields({
  transactionId: number,
  fromAccountId: number,
  toAccountId: number,
  date: number,
  descr: string,
  cents: number,
  createdAt: number,
  updatedAt: number,
});

export const transactionsCodec = array(transactionCodec);
