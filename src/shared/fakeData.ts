// Shared test data for fake implementations

// Helper to create Unix timestamp from date string
export const makeDbDate = (dateString: string): number => {
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// Category rows - mirrors the categories table structure
export const categoryRows = [
  { id: 1, name: 'Equity' },
  { id: 2, name: 'Assets' },
  { id: 3, name: 'Income' },
  { id: 4, name: 'Expenses' },
] as const;

// Account rows - mirrors the accounts table structure (with categoryId foreign key)
export const accountRows = [
  { id: 1, name: 'OpeningBalance', categoryId: 1 },
  { id: 2, name: 'Checking account', categoryId: 2 },
  { id: 3, name: 'Savings account', categoryId: 2 },
  { id: 4, name: 'Unknown_INCOME', categoryId: 3 },
  { id: 5, name: 'Employer ABC', categoryId: 3 },
  { id: 6, name: 'Unknown_EXPENSE', categoryId: 4 },
  { id: 7, name: 'Groceries', categoryId: 4 },
  { id: 8, name: 'Communications', categoryId: 4 },
  { id: 9, name: 'Transport', categoryId: 4 },
  { id: 10, name: 'Health', categoryId: 4 },
  { id: 11, name: 'Energy', categoryId: 4 },
  { id: 12, name: 'Clothing', categoryId: 4 },
  { id: 13, name: 'Leisure', categoryId: 4 },
] as const;

// Type-safe account and category name types derived from the data
export type StoredAccountName = typeof accountRows[number]['name'];
export type StoredCategoryName = typeof categoryRows[number]['name'];

// Type-safe helper to get account by name (throws if not found)
export const getAccountByName = (name: StoredAccountName) => {
  const account = accountRows.find(acc => acc.name === name);
  if (!account) {
    throw new Error(`Account not found: ${name}`);
  }
  return account;
};

// Type-safe helper to get category by name (throws if not found)
export const getCategoryByName = (name: StoredCategoryName) => {
  const category = categoryRows.find(cat => cat.name === name);
  if (!category) {
    throw new Error(`Category not found: ${name}`);
  }
  return category;
};
