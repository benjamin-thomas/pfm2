import type { Api } from './interface';
import { ApiErr } from './interface';
import type { Transaction, NewTransaction, UpdateTransaction } from '../../shared/transaction';
import type { AccountBalance } from '../../shared/account';
import { Result } from '../../shared/utils/result';
import { Maybe } from '../../shared/utils/maybe';

// Fake API that maintains coherent state
// Balances are calculated from transactions, so they stay in sync

const init = (): Api => {
  let transactions: Transaction[] = [];
  let nextId = 1;

  // Seed data
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

  // Initialize with seed data
  transactions = seedData.map(tx => ({
    ...tx,
    transactionId: nextId++,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  }));

  // Helper to calculate balances from transactions
  const calculateBalances = (txs: Transaction[]): AccountBalance[] => {
    const balanceMap = new Map<number, { added: number; removed: number }>();

    for (const tx of txs) {
      const from = balanceMap.get(tx.fromAccountId) || { added: 0, removed: 0 };
      from.removed += tx.cents;
      balanceMap.set(tx.fromAccountId, from);

      const to = balanceMap.get(tx.toAccountId) || { added: 0, removed: 0 };
      to.added += tx.cents;
      balanceMap.set(tx.toAccountId, to);
    }

    // Account metadata (would come from account repo in real impl)
    const accounts = [
      { accountId: 2, name: 'Checking account', categoryId: 2, categoryName: 'Assets' },
      { accountId: 5, name: 'Employer', categoryId: 3, categoryName: 'Income' },
      { accountId: 6, name: 'Unknown_EXPENSE', categoryId: 4, categoryName: 'Expenses' },
      { accountId: 7, name: 'Groceries', categoryId: 4, categoryName: 'Expenses' },
      { accountId: 9, name: 'Transport', categoryId: 4, categoryName: 'Expenses' },
    ];

    return accounts
      .map(account => {
        const balances = balanceMap.get(account.accountId) || { added: 0, removed: 0 };
        return {
          accountId: account.accountId,
          accountName: account.name,
          categoryId: account.categoryId,
          categoryName: account.categoryName,
          balance: balances.added - balances.removed,
        };
      })
      .filter(ab => ab.balance !== 0);
  };

  return {
    transactions: {
      list: async ({ budgetId }) => {
        const filtered = transactions.filter(tx => tx.budgetId === budgetId);
        return Result.ok(filtered);
      },

      findById: async (id) => {
        const tx = transactions.find(tx => tx.transactionId === id);
        return Result.ok(tx ? Maybe.just(tx) : Maybe.nothing);
      },

      create: async (transaction) => {
        const newTx: Transaction = {
          ...transaction,
          transactionId: nextId++,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        };
        transactions.push(newTx);
        return Result.ok(newTx);
      },

      update: async (id, transaction: UpdateTransaction) => {
        const index = transactions.findIndex(tx => tx.transactionId === id);
        if (index === -1) {
          return Result.err(ApiErr.notFound);
        }

        const existing = transactions[index]!;
        const updated: Transaction = {
          ...transaction,
          transactionId: existing.transactionId,
          createdAt: existing.createdAt,
          updatedAt: Math.floor(Date.now() / 1000),
        };
        transactions[index] = updated;
        return Result.ok(updated);
      },

      delete: async (id) => {
        const index = transactions.findIndex(tx => tx.transactionId === id);
        if (index === -1) {
          return Result.err(ApiErr.notFound);
        }
        transactions.splice(index, 1);
        return Result.ok(undefined);
      },
    },

    balances: {
      getBalances: async ({ budgetId }) => {
        const budgetTransactions = transactions.filter(tx => tx.budgetId === budgetId);
        const balances = calculateBalances(budgetTransactions);
        return Result.ok(balances);
      },
    },
  };
};

export const ApiFake = { init };
