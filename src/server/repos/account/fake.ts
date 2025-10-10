import type { Account, Category } from '../../../shared/account';
import type { AccountRepo, CategoryRepo } from './interface';

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

  return {
    listAll: async (): Promise<Account[]> => accounts,
    findByIdOrNull: async (id: number): Promise<Account | null> => {
      return accounts.find(a => a.accountId === id) || null;
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
    listAll: async (): Promise<Category[]> => categories,
    findByIdOrNull: async (id: number): Promise<Category | null> => {
      return categories.find(c => c.categoryId === id) || null;
    },
  };
};

export const CategoryRepoFake = { init: initCategory } as const;
