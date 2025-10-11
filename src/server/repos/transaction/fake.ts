// Fake transaction repository for testing - in-memory storage

import type { TransactionRepo, AffectedRows } from './interface';
import type {
  Transaction,
  NewTransaction,
  UpdateTransaction,
  TransactionFilters,
  PaginationParams,
  PaginatedResponse,
} from '../../../shared/transaction';
import { Option } from '../../../shared/utils/option';

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

    const applyFilters = (txs: Transaction[], filters: Option<TransactionFilters>): Transaction[] => {
      return Option.match(
        filters,
        () => txs, // No filters - return all
        (f) => txs.filter((tx) => {
          if (f.budgetId && tx.budgetId !== f.budgetId) return false;
          if (f.fromAccountId && tx.fromAccountId !== f.fromAccountId) return false;
          if (f.toAccountId && tx.toAccountId !== f.toAccountId) return false;
          if (f.startDate && tx.date < f.startDate) return false;
          if (f.endDate && tx.date > f.endDate) return false;
          if (f.search) {
            const searchLower = f.search.toLowerCase();
            if (!tx.descr.toLowerCase().includes(searchLower) &&
              !tx.descrOrig.toLowerCase().includes(searchLower)) {
              return false;
            }
          }
          return true;
        })
      );
    };

    const paginate = <T>(items: T[], params: Option<PaginationParams>): PaginatedResponse<T> => {
      return Option.match(
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
      create: async (transaction: NewTransaction): Promise<Transaction> => {
        const newTx = createTransaction(transaction);
        transactions.push(newTx);
        return newTx;
      },

      findById: async (id: number): Promise<Option<Transaction>> => {
        const transaction = transactions.find((tx) => tx.transactionId === id);
        return transaction ? Option.some(transaction) : Option.none;
      },

      list: async (
        filters: Option<TransactionFilters>,
        pagination: Option<PaginationParams>
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

      update: async (id: number, updates: UpdateTransaction): Promise<AffectedRows> => {
        const index = transactions.findIndex((tx) => tx.transactionId === id);
        if (index === -1) return { affectedRows: 0 };

        const existing = transactions[index]!;
        const updated: Transaction = {
          ...updates,
          transactionId: existing.transactionId,
          createdAt: existing.createdAt,
          updatedAt: Math.floor(Date.now() / 1000),
        };
        transactions[index] = updated;
        return { affectedRows: 1 };
      },

      remove: async (id: number): Promise<AffectedRows> => {
        const index = transactions.findIndex((tx) => tx.transactionId === id);
        if (index === -1) return { affectedRows: 0 };

        transactions.splice(index, 1);
        return { affectedRows: 1 };
      },

      createMany: async (newTransactions: NewTransaction[]): Promise<Transaction[]> => {
        const created = newTransactions.map((tx) => createTransaction(tx));
        transactions.push(...created);
        return created;
      },

      removeMany: async (ids: number[]): Promise<number> => {
        const idSet = new Set(ids);
        const before = transactions.length;
        transactions = transactions.filter((tx) => !idSet.has(tx.transactionId));
        return before - transactions.length;
      },
    };
  };

// Factory with seed data
const initWithSeed = (): TransactionRepo => {
  const repo = init();

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

export const TransactionRepoFake = { init, initWithSeed } as const;
