import type { Account, Category, NewAccount } from '../../../shared/account';
import { Maybe } from '../../../shared/utils/maybe';
import type { AccountRepo, AffectedRows, CategoryRepo } from './interface';

const init = (): AccountRepo => {
  // Seed accounts matching the transaction seed data
  const accounts: Account[] = [
    { accountId: 2, categoryId: 2, name: 'Checking account', createdAt: 0, updatedAt: 0 },
    { accountId: 3, categoryId: 2, name: 'Savings account', createdAt: 0, updatedAt: 0 },
    { accountId: 5, categoryId: 3, name: 'Employer', createdAt: 0, updatedAt: 0 },
    { accountId: 6, categoryId: 4, name: 'Unknown_EXPENSE', createdAt: 0, updatedAt: 0 },
    { accountId: 7, categoryId: 4, name: 'Groceries', createdAt: 0, updatedAt: 0 },
    { accountId: 9, categoryId: 4, name: 'Transport', createdAt: 0, updatedAt: 0 },
  ];
  let nextId = 10;

  return {
    listAll: (): Promise<Account[]> => {
      return Promise.resolve(accounts);
    },

    findById: (id: number): Promise<Maybe<Account>> => {
      const account = accounts.find(a => a.accountId === id);
      return Promise.resolve(account ? Maybe.just(account) : Maybe.nothing);
    },

    create: (newAccount: NewAccount): Promise<Account> => {
      const account: Account = {
        ...newAccount,
        accountId: nextId++,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      };
      accounts.push(account);
      return Promise.resolve(account);
    },

    update: (id: number, updates: NewAccount): Promise<AffectedRows> => {
      const index = accounts.findIndex(a => a.accountId === id);
      if (index === -1) return Promise.resolve({ affectedRows: 0 });

      const existing = accounts[index];
      const updated: Account = {
        ...updates,
        accountId: existing.accountId,
        createdAt: existing.createdAt,
        updatedAt: Math.floor(Date.now() / 1000),
      };
      accounts[index] = updated;
      return Promise.resolve({ affectedRows: 1 });
    },

    delete: (id: number): Promise<AffectedRows> => {
      const index = accounts.findIndex(a => a.accountId === id);
      if (index === -1) return Promise.resolve({ affectedRows: 0 });

      accounts.splice(index, 1);
      return Promise.resolve({ affectedRows: 1 });
    },
  };
};

export const AccountRepoFake = { init } as const;

const initCategory = (): CategoryRepo => {
  const categories: Category[] = [
    { categoryId: 2, name: 'Assets', createdAt: 0, updatedAt: 0 },
    { categoryId: 3, name: 'Income', createdAt: 0, updatedAt: 0 },
    { categoryId: 4, name: 'Expenses', createdAt: 0, updatedAt: 0 },
  ];

  return {
    listAll: (): Promise<Category[]> => {
      return Promise.resolve(categories);
    },

    findById: (id: number): Promise<Maybe<Category>> => {
      const category = categories.find(c => c.categoryId === id);
      return Promise.resolve(category ? Maybe.just(category) : Maybe.nothing);
    },
  };
};

export const CategoryRepoFake = { init: initCategory } as const;
