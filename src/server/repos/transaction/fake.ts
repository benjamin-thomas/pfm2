// Fake transaction repository for testing - in-memory storage

import type {
  NewTransaction,
  PaginatedResponse,
  PaginationParams,
  Transaction,
  TransactionFilters,
  UpdateTransaction,
} from '../../../shared/transaction';
import { Maybe } from '../../../shared/utils/maybe';
import type { AffectedRows, TransactionRepo } from './interface';

const init = (): TransactionRepo => {
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

  const applyFilters = (txs: Transaction[], filters: Maybe<TransactionFilters>): Transaction[] => {
    return Maybe.match(
      filters,
      () => txs, // No filters - return all
      (f) => txs.filter((tx) => {
        if (f.fromAccountId && tx.fromAccountId !== f.fromAccountId) return false;
        if (f.toAccountId && tx.toAccountId !== f.toAccountId) return false;
        if (f.startDate && tx.date < f.startDate) return false;
        if (f.endDate && tx.date > f.endDate) return false;
        if (f.search) {
          const searchLower = f.search.toLowerCase();
          if (!tx.descr.toLowerCase().includes(searchLower)) {
            return false;
          }
        }
        return true;
      })
    );
  };

  const paginate = <T>(items: T[], params: Maybe<PaginationParams>): PaginatedResponse<T> => {
    return Maybe.match(
      params,
      () => {
        // No pagination - return first 50
        return {
          items: items.slice(0, 50),
          total: items.length,
          page: 1,
          pageSize: 50,
        };
      },
      (p) => {
        const page = p.page || 1;
        const pageSize = p.pageSize || 50;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        if (p.orderBy) {
          const key = p.orderBy as keyof T;
          const dir = p.orderDir || 'asc';
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
      }
    );
  };

  return {
    create: (transaction: NewTransaction): Promise<Transaction> => {
      const newTx = createTransaction(transaction);
      transactions.push(newTx);
      return Promise.resolve(newTx);
    },

    findById: (id: number): Promise<Maybe<Transaction>> => {
      const transaction = transactions.find((tx) => tx.transactionId === id);
      return Promise.resolve(transaction ? Maybe.just(transaction) : Maybe.nothing);
    },

    list: (
      filters: Maybe<TransactionFilters>,
      pagination: Maybe<PaginationParams>
    ): Promise<PaginatedResponse<Transaction>> => {
      const filtered = applyFilters(transactions, filters);
      return Promise.resolve(paginate(filtered, pagination));
    },

    listByAccount: (accountId: number): Promise<Transaction[]> => {
      return Promise.resolve(transactions.filter(
        (tx) => tx.fromAccountId === accountId || tx.toAccountId === accountId
      ));
    },

    update: (id: number, updates: UpdateTransaction): Promise<AffectedRows> => {
      const index = transactions.findIndex((tx) => tx.transactionId === id);
      if (index === -1) return Promise.resolve({ affectedRows: 0 });

      const existing = transactions[index];
      const updated: Transaction = {
        ...updates,
        transactionId: existing.transactionId,
        createdAt: existing.createdAt,
        updatedAt: Math.floor(Date.now() / 1000),
      };
      transactions[index] = updated;
      return Promise.resolve({ affectedRows: 1 });
    },

    delete: (id: number): Promise<AffectedRows> => {
      const index = transactions.findIndex((tx) => tx.transactionId === id);
      if (index === -1) return Promise.resolve({ affectedRows: 0 });

      transactions.splice(index, 1);
      return Promise.resolve({ affectedRows: 1 });
    },

    createMany: (newTransactions: NewTransaction[]): Promise<Transaction[]> => {
      const created = newTransactions.map((tx) => createTransaction(tx));
      transactions.push(...created);
      return Promise.resolve(created);
    },

    deleteMany: (ids: number[]): Promise<number> => {
      const idSet = new Set(ids);
      const before = transactions.length;
      transactions = transactions.filter((tx) => !idSet.has(tx.transactionId));
      return Promise.resolve(before - transactions.length);
    },
  };
};

// Factory with seed data
const initWithSeed = (): TransactionRepo => {
  const repo = init();

  const seedData: NewTransaction[] = [
    {
      fromAccountId: 5, // Employer
      toAccountId: 2, // Checking account
      date: Math.floor(new Date('2024-09-30').getTime() / 1000),
      descr: 'Monthly Income',
      cents: 100000, // +1000.00 EUR
    },
    {
      fromAccountId: 2, // Checking account
      toAccountId: 6, // Unknown_EXPENSE
      date: Math.floor(new Date('2024-09-25').getTime() / 1000),
      descr: 'Rent Payment',
      cents: 50000, // -500.00 EUR
    },
    {
      fromAccountId: 2, // Checking account
      toAccountId: 7, // Groceries
      date: Math.floor(new Date('2024-09-20').getTime() / 1000),
      descr: 'Grocery Store',
      cents: 3400, // -34.00 EUR
    },
    {
      fromAccountId: 2, // Checking account
      toAccountId: 9, // Transport
      date: Math.floor(new Date('2024-09-18').getTime() / 1000),
      descr: 'Gas Station',
      cents: 2500, // -25.00 EUR
    },
  ];

  // Seed synchronously - it's just in-memory
  Promise.all(seedData.map((tx) => repo.create(tx)));

  return repo;
};

export const TransactionRepoFake = { init, initWithSeed } as const;
