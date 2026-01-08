// Shared test data for fake implementations

import type { Account } from "./account";
import type { Category } from "./category";
import type { Transaction } from "./transaction";

// Helper to create Unix timestamp from date string (kept for tests)
export const makeDbDate = (dateString: string): number => {
	return Math.floor(new Date(dateString).getTime() / 1000);
};

// Helper to create Unix timestamp (seconds) relative to today
// offsetDays: -1 = yesterday, -2 = 2 days ago, etc.
// Input: clockNowMs in milliseconds (like Date.now())
// Output: Unix timestamp in seconds (for SQL storage)
const makeDateFrom = (
	clockNowMs: number,
	{ offsetDays }: { offsetDays: number },
): number => {
	const today = new Date(clockNowMs);
	today.setHours(0, 0, 0, 0); // normalize to midnight
	const targetDate = new Date(today);
	targetDate.setDate(targetDate.getDate() + offsetDays);
	return Math.floor(targetDate.getTime() / 1000);
};

// Factory functions for creating fake data with proper dependency chain

type MakeCategoryRowsResult = {
	categoryRows: Category[];
	categoryNameToId: Map<string, number>;
};

export const makeCategoryRows = (clock: {
	now: () => number;
}): MakeCategoryRowsResult => {
	const nowSecs = Math.floor(clock.now() / 1000);
	const categoryRows: Category[] = [
		{ id: 1, name: "Equity", createdAt: nowSecs, updatedAt: nowSecs },
		{ id: 2, name: "Assets", createdAt: nowSecs, updatedAt: nowSecs },
		{ id: 3, name: "Income", createdAt: nowSecs, updatedAt: nowSecs },
		{ id: 4, name: "Expenses", createdAt: nowSecs, updatedAt: nowSecs },
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
	const nowSecs = Math.floor(clock.now() / 1000);
	const catId = (name: string): number => {
		const id = categoryNameToId.get(name);
		if (!id) throw new Error(`Unknown category: "${name}"`);
		return id;
	};
	// Note: "Checking account" is first so it becomes the default selected account
	const accountRows: Account[] = [
		{
			id: 1,
			name: "Checking account",
			categoryId: catId("Assets"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 2,
			name: "OpeningBalance",
			categoryId: catId("Equity"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 3,
			name: "Savings account",
			categoryId: catId("Assets"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 4,
			name: "Unknown_INCOME",
			categoryId: catId("Income"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 5,
			name: "Employer ABC",
			categoryId: catId("Income"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 6,
			name: "Unknown_EXPENSE",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 7,
			name: "Groceries",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 8,
			name: "Communications",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 9,
			name: "Transport",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 10,
			name: "Health",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 11,
			name: "Energy",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 12,
			name: "Clothing",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 13,
			name: "Leisure",
			categoryId: catId("Expenses"),
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
	];
	const accountNameToId = new Map(accountRows.map((row) => [row.name, row.id]));
	return { accountRows, accountNameToId };
};

export const makeTransactionRows = (
	clock: { now: () => number },
	accountNameToId: Map<string, number>,
): Transaction[] => {
	const nowMs = clock.now();
	const nowSecs = Math.floor(nowMs / 1000);
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
			date: makeDateFrom(nowMs, { offsetDays: -31 }),
			descr: "Opening Balance",
			cents: 150000,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 2,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Transport"),
			date: makeDateFrom(nowMs, { offsetDays: -30 }),
			descr: "Metro Monthly Pass",
			cents: 7500,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 3,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDateFrom(nowMs, { offsetDays: -27 }),
			descr: "Weekly Groceries - SuperMart",
			cents: 6247,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 4,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDateFrom(nowMs, { offsetDays: -24 }),
			descr: "Fresh Produce Market",
			cents: 3418,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 5,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Energy"),
			date: makeDateFrom(nowMs, { offsetDays: -22 }),
			descr: "Electricity Bill",
			cents: 8543,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 6,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDateFrom(nowMs, { offsetDays: -20 }),
			descr: "Weekly Groceries - SuperMart",
			cents: 5832,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 7,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Communications"),
			date: makeDateFrom(nowMs, { offsetDays: -17 }),
			descr: "Internet & Phone Bill",
			cents: 6500,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 8,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Transport"),
			date: makeDateFrom(nowMs, { offsetDays: -16 }),
			descr: "Gas Station Fill-up",
			cents: 4527,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 9,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Clothing"),
			date: makeDateFrom(nowMs, { offsetDays: -15 }),
			descr: "Electronics Store - Headphones",
			cents: 8949,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 10,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDateFrom(nowMs, { offsetDays: -13 }),
			descr: "Weekly Groceries - SuperMart",
			cents: 6891,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 11,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Health"),
			date: makeDateFrom(nowMs, { offsetDays: -12 }),
			descr: "Pharmacy - Prescriptions",
			cents: 3265,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 12,
			fromAccountId: accId("Clothing"),
			toAccountId: accId("Checking account"),
			date: makeDateFrom(nowMs, { offsetDays: -10 }),
			descr: "Electronics Store - Headphones Refund",
			cents: 8949,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 13,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Unknown_EXPENSE"),
			date: makeDateFrom(nowMs, { offsetDays: -7 }),
			descr: "Monthly Rent",
			cents: 95000,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 14,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Groceries"),
			date: makeDateFrom(nowMs, { offsetDays: -6 }),
			descr: "Weekly Groceries - SuperMart",
			cents: 5523,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 15,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Clothing"),
			date: makeDateFrom(nowMs, { offsetDays: -4 }),
			descr: "Work Clothes",
			cents: 12345,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 16,
			fromAccountId: accId("Unknown_INCOME"),
			toAccountId: accId("Checking account"),
			date: makeDateFrom(nowMs, { offsetDays: -3 }),
			descr: "Side hustle",
			cents: 35000,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 17,
			fromAccountId: accId("Employer ABC"),
			toAccountId: accId("Checking account"),
			date: makeDateFrom(nowMs, { offsetDays: -1 }),
			descr: "Monthly Salary",
			cents: 250000,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
		{
			id: 18,
			fromAccountId: accId("Checking account"),
			toAccountId: accId("Leisure"),
			date: makeDateFrom(nowMs, { offsetDays: -1 }),
			descr: "Dinner & Movie",
			cents: 7582,
			createdAt: nowSecs,
			updatedAt: nowSecs,
		},
	];
};
