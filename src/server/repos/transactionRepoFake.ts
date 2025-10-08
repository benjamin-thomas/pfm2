// Fake transaction repository for testing - in-memory storage

import type { TransactionRepo } from './transactionRepo';
import type {
  Transaction,
  NewTransaction,
  UpdateTransaction,
  TransactionFilters,
  PaginationParams,
  PaginatedResponse,
} from '@shared/transaction';

export const createTransactionRepoFake = (): TransactionRepo => {
  let transactions: Transaction[] = [];
  let nextId = 1;

  const createTransaction = (newTx: NewTransaction): Transaction => {
    const now = Math.floor(Date.now() / 1000);
    return {
      ...newTx,
      transactionId: nextId++,
      createdAt: now,
      updatedAt: now,
    };
  };

  const applyFilters = (txs: Transaction[], filters?: TransactionFilters): Transaction[] => {
    if (!filters) return txs;

    return txs.filter((tx) => {
      if (filters.budgetId && tx.budgetId !== filters.budgetId) return false;
      if (filters.fromAccountId && tx.fromAccountId !== filters.fromAccountId) return false;
      if (filters.toAccountId && tx.toAccountId !== filters.toAccountId) return false;
      if (filters.startDate && tx.date < filters.startDate) return false;
      if (filters.endDate && tx.date > filters.endDate) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!tx.descr.toLowerCase().includes(searchLower) &&
          !tx.descrOrig.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  };

  const paginate = <T>(items: T[], params?: PaginationParams): PaginatedResponse<T> => {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    if (params?.orderBy) {
      const key = params.orderBy as keyof T;
      const dir = params.orderDir || 'asc';
      items.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return {
      items: items.slice(start, end),
      total: items.length,
      page,
      pageSize,
    };
  };

  return {
    create: async (transaction: NewTransaction): Promise<Transaction> => {
      const newTx = createTransaction(transaction);
      transactions.push(newTx);
      return newTx;
    },

    findByIdOrNull: async (id: number): Promise<Transaction | null> => {
      return transactions.find((tx) => tx.transactionId === id) || null;
    },

    list: async (
      filters?: TransactionFilters,
      pagination?: PaginationParams
    ): Promise<PaginatedResponse<Transaction>> => {
      const filtered = applyFilters(transactions, filters);
      return paginate(filtered, pagination);
    },

    listByBudget: async (budgetId: number): Promise<Transaction[]> => {
      return transactions.filter((tx) => tx.budgetId === budgetId);
    },

    listByAccount: async (accountId: number): Promise<Transaction[]> => {
      return transactions.filter(
        (tx) => tx.fromAccountId === accountId || tx.toAccountId === accountId
      );
    },

    updateOrThrow: async (id: number, updates: UpdateTransaction): Promise<Transaction> => {
      const index = transactions.findIndex((tx) => tx.transactionId === id);
      if (index === -1) {
        throw new Error(`Transaction ${id} not found`);
      }

      const existing = transactions[index]!;
      const updated: Transaction = {
        ...updates,
        transactionId: existing.transactionId,
        createdAt: existing.createdAt,
        updatedAt: Math.floor(Date.now() / 1000),
      };
      transactions[index] = updated;
      return updated;
    },

    delete: async (id: number): Promise<boolean> => {
      const index = transactions.findIndex((tx) => tx.transactionId === id);
      if (index === -1) return false;
      transactions.splice(index, 1);
      return true;
    },

    createMany: async (newTransactions: NewTransaction[]): Promise<Transaction[]> => {
      const created = newTransactions.map((tx) => createTransaction(tx));
      transactions.push(...created);
      return created;
    },

    deleteMany: async (ids: number[]): Promise<number> => {
      const idSet = new Set(ids);
      const before = transactions.length;
      transactions = transactions.filter((tx) => !idSet.has(tx.transactionId));
      return before - transactions.length;
    },
  };
};

// Factory with seed data
export const createTransactionRepoFakeWithSeed = (): TransactionRepo => {
  const repo = createTransactionRepoFake();

  const seedData: NewTransaction[] = [
    {
      budgetId: 1,
      fromAccountId: 5, // Employer
      toAccountId: 2, // Checking account
      date: Math.floor(new Date('2024-09-30').getTime() / 1000),
      descrOrig: 'Monthly Income',
      descr: 'Monthly Income',
      cents: 100000, // +1000.00 EUR
      uniqueFitId: 'TXN001',
    },
    {
      budgetId: 1,
      fromAccountId: 2, // Checking account
      toAccountId: 6, // Unknown_EXPENSE
      date: Math.floor(new Date('2024-09-25').getTime() / 1000),
      descrOrig: 'Rent Payment',
      descr: 'Rent Payment',
      cents: 50000, // -500.00 EUR
      uniqueFitId: 'TXN002',
    },
    {
      budgetId: 1,
      fromAccountId: 2, // Checking account
      toAccountId: 7, // Groceries
      date: Math.floor(new Date('2024-09-20').getTime() / 1000),
      descrOrig: 'Grocery Store',
      descr: 'Grocery Store',
      cents: 3400, // -34.00 EUR
      uniqueFitId: 'TXN003',
    },
    {
      budgetId: 1,
      fromAccountId: 2, // Checking account
      toAccountId: 9, // Transport
      date: Math.floor(new Date('2024-09-18').getTime() / 1000),
      descrOrig: 'Gas Station',
      descr: 'Gas Station',
      cents: 2500, // -25.00 EUR
      uniqueFitId: 'TXN004',
    },
  ];

  // Seed synchronously - it's just in-memory
  Promise.all(seedData.map((tx) => repo.create(tx)));

  return repo;
};
