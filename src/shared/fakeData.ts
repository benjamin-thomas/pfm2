// Shared test data for fake implementations

import type { Account } from "./account";
import type { Category } from "./category";
import type { Transaction } from "./transaction";

// Helper to create Unix timestamp from date string
export const makeDbDate = (dateString: string): number => {
	return Math.floor(new Date(dateString).getTime() / 1000);
};

// Factory functions for creating fake data with proper dependency chain

type MakeCategoryRowsResult = {
	categoryRows: Category[];
	categoryNameToId: Map<string, number>;
};

export const makeCategoryRows = (clock: {
	now: () => number;
}): MakeCategoryRowsResult => {
	const now = clock.now();
	const categoryRows: Category[] = [
		{ id: 1, name: "Equity", createdAt: now, updatedAt: now },
		{ id: 2, name: "Assets", createdAt: now, updatedAt: now },
		{ id: 3, name: "Income", createdAt: now, updatedAt: now },
		{ id: 4, name: "Expenses", createdAt: now, updatedAt: now },
	];
	const categoryNameToId = new Map(
		categoryRows.map((row) => [row.name, row.id]),
	);
	return { categoryRows, categoryNameToId };
};

type MakeAccountRowsResult = {
	accountRows: Account[];
	accountNameToId: Map<string, number>;
};

export const makeAccountRows = (
	clock: { now: () => number },
	categoryNameToId: Map<string, number>,
): MakeAccountRowsResult => {
	const now = clock.now();
	const catId = (name: string): number => {
		const id = categoryNameToId.get(name);
		if (!id) throw new Error(`Unknown category: "${name}"`);
		return id;
	};
	const accountRows: Account[] = [
		{
			id: 1,
			name: "OpeningBalance",
			categoryId: catId("Equity"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 2,
			name: "Checking account",
			categoryId: catId("Assets"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 3,
			name: "Savings account",
			categoryId: catId("Assets"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 4,
			name: "Unknown_INCOME",
			categoryId: catId("Income"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 5,
			name: "Employer ABC",
			categoryId: catId("Income"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 6,
			name: "Unknown_EXPENSE",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 7,
			name: "Groceries",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 8,
			name: "Communications",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 9,
			name: "Transport",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 10,
			name: "Health",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 11,
			name: "Energy",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 12,
			name: "Clothing",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 13,
			name: "Leisure",
			categoryId: catId("Expenses"),
			createdAt: now,
			updatedAt: now,
		},
	];
	const accountNameToId = new Map(accountRows.map((row) => [row.name, row.id]));
	return { accountRows, accountNameToId };
};

export const makeTransactionRows = (
	clock: { now: () => number },
	accountNameToId: Map<string, number>,
): Transaction[] => {
	const now = clock.now();
	const accId = (name: string): number => {
		const id = accountNameToId.get(name);
		if (!id) throw new Error(`Unknown account: "${name}"`);
		return id;
	};
	return [
		{
			id: 1,
			fromAccountId: accId("Employer ABC"),
			toAccountId: accId("Checking account"),
			date: makeDbDate("2024-09-30"),
			descr: "Monthly Income",
			cents: 100000,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 2,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Unknown_EXPENSE"),
			date: makeDbDate("2024-09-25"),
			descr: "Rent Payment",
			cents: 50000,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 3,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDbDate("2024-09-20"),
			descr: "Grocery Store",
			cents: 3400,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 4,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Transport"),
			date: makeDbDate("2024-09-18"),
			descr: "Gas Station",
			cents: 2500,
			createdAt: now,
			updatedAt: now,
		},
	];
};
