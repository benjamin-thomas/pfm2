// Shared test data for fake implementations

import type { NewAccount } from "./account";
import type { NewCategory } from "./category";
import type { NewTransaction } from "./transaction";

// Helper to create Unix timestamp from date string
export const makeDbDate = (dateString: string): number => {
	return Math.floor(new Date(dateString).getTime() / 1000);
};

// Category rows - mirrors the categories table structure
export const categoryRows: NewCategory[] = [
	{ name: "Equity" },
	{ name: "Assets" },
	{ name: "Income" },
	{ name: "Expenses" },
];

// Account rows - mirrors the accounts table structure (with categoryId foreign key)
export const accountRows: NewAccount[] = [
	{ name: "OpeningBalance", categoryId: 1 },
	{ name: "Checking account", categoryId: 2 },
	{ name: "Savings account", categoryId: 2 },
	{ name: "Unknown_INCOME", categoryId: 3 },
	{ name: "Employer ABC", categoryId: 3 },
	{ name: "Unknown_EXPENSE", categoryId: 4 },
	{ name: "Groceries", categoryId: 4 },
	{ name: "Communications", categoryId: 4 },
	{ name: "Transport", categoryId: 4 },
	{ name: "Health", categoryId: 4 },
	{ name: "Energy", categoryId: 4 },
	{ name: "Clothing", categoryId: 4 },
	{ name: "Leisure", categoryId: 4 },
];

// Transaction rows - seed data for fake transaction repo
export const transactionRows: NewTransaction[] = [
	{
		fromAccountId: 5, // Employer
		toAccountId: 2, // Checking account
		date: makeDbDate("2024-09-30"),
		descr: "Monthly Income",
		cents: 100000, // +1000.00 EUR
	},
	{
		fromAccountId: 2, // Checking account
		toAccountId: 6, // Unknown_EXPENSE
		date: makeDbDate("2024-09-25"),
		descr: "Rent Payment",
		cents: 50000, // -500.00 EUR
	},
	{
		fromAccountId: 2, // Checking account
		toAccountId: 7, // Groceries
		date: makeDbDate("2024-09-20"),
		descr: "Grocery Store",
		cents: 3400, // -34.00 EUR
	},
	{
		fromAccountId: 2, // Checking account
		toAccountId: 9, // Transport
		date: makeDbDate("2024-09-18"),
		descr: "Gas Station",
		cents: 2500, // -25.00 EUR
	},
];
