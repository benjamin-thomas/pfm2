import type { Account, Category, NewAccount } from '../../../shared/account';
import { accountRows, categoryRows } from '../../../shared/fake-data';
import { Maybe } from '../../../shared/utils/maybe';
import type { AccountRepo, AffectedRows, CategoryRepo } from './interface';

const init = (): AccountRepo => {
  // Initialize accounts from shared fake-data rows
  const accounts: Account[] = accountRows.map(row => ({
    accountId: row.id,
    name: row.name,
    categoryId: row.categoryId,
    createdAt: 0,
    updatedAt: 0,
  }));
  let nextId = accountRows.length + 1;

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
  // Initialize categories from shared fake-data rows
  const categories: Category[] = categoryRows.map(row => ({
    categoryId: row.id,
    name: row.name,
    createdAt: 0,
    updatedAt: 0,
  }));

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
