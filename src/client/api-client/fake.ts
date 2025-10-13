import type { AccountBalance } from '../../shared/account';
import { FakeAccount, FakeCategory } from '../../shared/fake-data';
import type { NewTransaction, Transaction, UpdateTransaction } from '../../shared/transaction';
import { Maybe } from '../../shared/utils/maybe';
import { Result } from '../../shared/utils/result';
import type { Api } from './interface';
import { ApiErr } from './interface';

// Fake API that maintains coherent state
// Balances are calculated from transactions, so they stay in sync

const init = (seedData: NewTransaction[]): Api => {
  let transactions: Transaction[] = [];
  let nextId = 1;

  // Initialize with provided seed data
  transactions = seedData.map(tx => ({
    ...tx,
    transactionId: nextId++,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  }));

  // Helper to compute balances from transactions
  const computeBalances = (txs: Transaction[]): AccountBalance[] => {
    const checkingAccount = FakeAccount.checking;
    const employerAccount = FakeAccount.employer;
    const unknownExpenseAccount = FakeAccount.unknownExpense;
    const groceriesAccount = FakeAccount.groceries;
    const transportAccount = FakeAccount.transport;

    const assetsCategory = FakeCategory.assets;
    const incomeCategory = FakeCategory.income;
    const expensesCategory = FakeCategory.expenses;

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
      { accountId: checkingAccount.id, name: checkingAccount.name, categoryId: assetsCategory.id, categoryName: assetsCategory.name },
      { accountId: employerAccount.id, name: employerAccount.name, categoryId: incomeCategory.id, categoryName: incomeCategory.name },
      { accountId: unknownExpenseAccount.id, name: unknownExpenseAccount.name, categoryId: expensesCategory.id, categoryName: expensesCategory.name },
      { accountId: groceriesAccount.id, name: groceriesAccount.name, categoryId: expensesCategory.id, categoryName: expensesCategory.name },
      { accountId: transportAccount.id, name: transportAccount.name, categoryId: expensesCategory.id, categoryName: expensesCategory.name },
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
      list: ({ searchTerm }) => {
        const trimmed = searchTerm.trim().toLowerCase();
        const filtered = trimmed
          ? transactions.filter(tx => tx.descr.toLowerCase().includes(trimmed))
          : transactions;
        return Promise.resolve(Result.ok(filtered));
      },

      findById: (id) => {
        const tx = transactions.find(tx => tx.transactionId === id);
        return Promise.resolve(Result.ok(tx ? Maybe.just(tx) : Maybe.nothing));
      },

      create: (transaction) => {
        const newTx: Transaction = {
          ...transaction,
          transactionId: nextId++,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        };
        transactions.push(newTx);
        return Promise.resolve(Result.ok(newTx));
      },

      update: (id, transaction: UpdateTransaction) => {
        const index = transactions.findIndex(tx => tx.transactionId === id);
        if (index === -1) {
          return Promise.resolve(Result.err(ApiErr.notFound));
        }

        const existing = transactions[index];


        const updated: Transaction = {
          ...transaction,
          transactionId: existing.transactionId,
          createdAt: existing.createdAt,
          updatedAt: Math.floor(Date.now() / 1000),
        };
        transactions[index] = updated;
        return Promise.resolve(Result.ok(updated));
      },

      delete: (id) => {
        const index = transactions.findIndex(tx => tx.transactionId === id);
        if (index === -1) {
          return Promise.resolve(Result.err(ApiErr.notFound));
        }
        transactions.splice(index, 1);
        return Promise.resolve(Result.ok(undefined));
      },
    },

    balances: {
      getBalances: () => {
        const balances = computeBalances(transactions);
        return Promise.resolve(Result.ok(balances));
      },
    },
  };
};

export const ApiFake = { init };
