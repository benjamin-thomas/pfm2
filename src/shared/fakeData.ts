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
			fromAccountId: accId("OpeningBalance"),
			toAccountId: accId("Checking account"),
			date: makeDbDate("2025-01-01"),
			descr: "Opening Balance",
			cents: 150000,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 2,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Transport"),
			date: makeDbDate("2025-01-02"),
			descr: "Metro Monthly Pass",
			cents: 7500,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 3,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDbDate("2025-01-05"),
			descr: "Weekly Groceries - SuperMart",
			cents: 6247,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 4,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDbDate("2025-01-08"),
			descr: "Fresh Produce Market",
			cents: 3418,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 5,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Energy"),
			date: makeDbDate("2025-01-10"),
			descr: "Electricity Bill",
			cents: 8543,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 6,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDbDate("2025-01-12"),
			descr: "Weekly Groceries - SuperMart",
			cents: 5832,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 7,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Communications"),
			date: makeDbDate("2025-01-15"),
			descr: "Internet & Phone Bill",
			cents: 6500,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 8,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Transport"),
			date: makeDbDate("2025-01-16"),
			descr: "Gas Station Fill-up",
			cents: 4527,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 9,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Clothing"),
			date: makeDbDate("2025-01-17"),
			descr: "Electronics Store - Headphones",
			cents: 8949,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 10,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDbDate("2025-01-19"),
			descr: "Weekly Groceries - SuperMart",
			cents: 6891,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 11,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Health"),
			date: makeDbDate("2025-01-20"),
			descr: "Pharmacy - Prescriptions",
			cents: 3265,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 12,
			fromAccountId: accId("Clothing"),
			toAccountId: accId("Checking account"),
			date: makeDbDate("2025-01-22"),
			descr: "Electronics Store - Headphones Refund",
			cents: 8949,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 13,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Unknown_EXPENSE"),
			date: makeDbDate("2025-01-25"),
			descr: "Monthly Rent",
			cents: 95000,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 14,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDbDate("2025-01-26"),
			descr: "Weekly Groceries - SuperMart",
			cents: 5523,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 15,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Clothing"),
			date: makeDbDate("2025-01-28"),
			descr: "Work Clothes",
			cents: 12345,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 16,
			fromAccountId: accId("Unknown_INCOME"),
			toAccountId: accId("Checking account"),
			date: makeDbDate("2025-01-29"),
			descr: "Side hustle",
			cents: 35000,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 17,
			fromAccountId: accId("Employer ABC"),
			toAccountId: accId("Checking account"),
			date: makeDbDate("2025-01-31"),
			descr: "Monthly Salary",
			cents: 250000,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: 18,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Leisure"),
			date: makeDbDate("2025-01-31"),
			descr: "Dinner & Movie",
			cents: 7582,
			createdAt: now,
			updatedAt: now,
		},
	];
};
