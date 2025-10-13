// Shared test data for fake implementations

// Helper to create Unix timestamp from date string
export const makeDbDate = (dateString: string): number => {
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// Fake categories for testing
export const FakeCategory = {
  assets: { id: 1, name: 'Assets' },
  income: { id: 2, name: 'Income' },
  expenses: { id: 3, name: 'Expenses' },
} as const;

// Fake accounts for testing
export const FakeAccount = {
  checking: { id: 1, name: 'Checking account' },
  employer: { id: 2, name: 'Employer' },
  unknownExpense: { id: 3, name: 'Unknown_EXPENSE' },
  groceries: { id: 4, name: 'Groceries' },
  transport: { id: 5, name: 'Transport' },
} as const;
