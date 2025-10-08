// Account and Category domain types

export type Category = {
  categoryId: number;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type Account = {
  accountId: number;
  categoryId: number;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type NewAccount = Omit<Account, 'accountId' | 'createdAt' | 'updatedAt'>;

export type NewCategory = Omit<Category, 'categoryId' | 'createdAt' | 'updatedAt'>;

// View model with balance
export type AccountView = Account & {
  categoryName: string;
  balance: number; // in cents
};

// Balance read for dashboard
export type AccountBalance = {
  accountId: number;
  accountName: string;
  categoryId: number;
  categoryName: string;
  balance: number; // in cents
};
