import type { Account, AccountBalance } from "../../shared/account";
import type { Category } from "../../shared/category";
import {
	makeAccountRows,
	makeCategoryRows,
	makeDbDate,
} from "../../shared/fakeData";
import type { LedgerEntry } from "../../shared/ledger";
import type { Transaction, UpdateTransaction } from "../../shared/transaction";
import { validateTransaction } from "../../shared/transactionValidation";
import { Maybe } from "../../shared/utils/maybe";
import { Result } from "../../shared/utils/result";
import type { Api } from "./interface";
import { ApiErr } from "./interface";

// Fake API that maintains coherent state
// Balances are calculated from transactions, so they stay in sync

// Types for test helper
type Clock = { now: () => number };

type TestApiConfig = {
	categories: (clock: Clock) => {
		categoryRows: Category[];
		categoryNameToId: Map<string, number>;
	};
	accounts: (
		clock: Clock,
		categoryNameToId: Map<string, number>,
	) => {
		accountRows: Account[];
		accountNameToId: Map<string, number>;
	};
	transactions: (
		clock: Clock,
		accountNameToId: Map<string, number>,
	) => Transaction[];
};

// Core function that builds an Api from pre-built rows
const buildApi = (
	categoryRows: Category[],
	accountRows: Account[],
	seedTransactions: Transaction[],
): Api => {
	const transactions: Transaction[] = [...seedTransactions];
	let nextId =
		transactions.length === 0
			? 1
			: Math.max(...transactions.map((tx) => tx.id)) + 1;

	// Helper to compute balances from transactions
	const computeBalances = (txs: Transaction[]): AccountBalance[] => {
		const balanceMap = new Map<number, { added: number; removed: number }>();

		for (const tx of txs) {
			const from = balanceMap.get(tx.fromAccountId) || { added: 0, removed: 0 };
			from.removed += tx.cents;
			balanceMap.set(tx.fromAccountId, from);

			const to = balanceMap.get(tx.toAccountId) || { added: 0, removed: 0 };
			to.added += tx.cents;
			balanceMap.set(tx.toAccountId, to);
		}

		// Join accountRows with categoryRows (like SQL JOIN)
		return accountRows.map((account) => {
			const category = categoryRows.find(
				(cat) => cat.id === account.categoryId,
			);
			if (!category) {
				throw new Error(`Category not found for account ${account.name}`);
			}

			const balances = balanceMap.get(account.id) || { added: 0, removed: 0 };
			return {
				accountId: account.id,
				accountName: account.name,
				categoryId: category.id,
				categoryName: category.name,
				balance: balances.added - balances.removed,
			};
		});
	};

	return {
		transactions: {
			list: ({ searchTerm }) => {
				const trimmed = searchTerm.trim().toLowerCase();
				const filtered = trimmed
					? transactions.filter((tx) =>
							tx.descr.toLowerCase().includes(trimmed),
						)
					: transactions;
				return Promise.resolve(Result.ok(filtered));
			},

			findById: (id) => {
				const tx = transactions.find((tx) => tx.id === id);
				return Promise.resolve(Result.ok(tx ? Maybe.just(tx) : Maybe.nothing));
			},

			create: (transaction) => {
				return Promise.resolve(
					validateTransaction(
						transaction.fromAccountId,
						transaction.toAccountId,
						() => {
							const newTx: Transaction = {
								...transaction,
								id: nextId++,
								createdAt: Math.floor(Date.now() / 1000),
								updatedAt: Math.floor(Date.now() / 1000),
							};
							transactions.push(newTx);
							return Result.ok(newTx);
						},
					),
				);
			},

			update: (id, transaction: UpdateTransaction) => {
				const index = transactions.findIndex((tx) => tx.id === id);
				if (index === -1) {
					return Promise.resolve(Result.err(ApiErr.notFound));
				}

				return Promise.resolve(
					validateTransaction(
						transaction.fromAccountId,
						transaction.toAccountId,
						() => {
							const existing = transactions[index];
							const updated: Transaction = {
								...transaction,
								id: existing.id,
								createdAt: existing.createdAt,
								updatedAt: Math.floor(Date.now() / 1000),
							};
							transactions[index] = updated;
							return Result.ok(updated);
						},
					),
				);
			},

			delete: (id) => {
				const index = transactions.findIndex((tx) => tx.id === id);
				if (index === -1) {
					return Promise.resolve(Result.err(ApiErr.notFound));
				}
				transactions.splice(index, 1);
				return Promise.resolve(Result.ok(undefined));
			},
		},

		ledger: {
			getLedgerForAccount: (selectedAccountId: number) => {
				// Filter transactions involving the selected account
				const relevantTransactions = transactions.filter(
					(tx) =>
						tx.fromAccountId === selectedAccountId ||
						tx.toAccountId === selectedAccountId,
				);

				// Sort by date ascending
				const sorted = [...relevantTransactions].sort(
					(a, b) => a.date - b.date,
				);

				// Transform to ledger entries with flow and running balance
				let runningBalance = 0;
				const ledgerEntries: LedgerEntry[] = sorted.map((tx) => {
					// Calculate flow from perspective of selected account
					const flowCents =
						tx.cents * (tx.fromAccountId === selectedAccountId ? -1 : 1);
					const priorBalance = runningBalance;
					runningBalance += flowCents;

					// Lookup account names from accountRows
					const fromAccount = accountRows.find(
						(acc) => acc.id === tx.fromAccountId,
					);
					const toAccount = accountRows.find(
						(acc) => acc.id === tx.toAccountId,
					);

					return {
						...tx,
						fromAccountName: fromAccount?.name ?? `Account ${tx.fromAccountId}`,
						toAccountName: toAccount?.name ?? `Account ${tx.toAccountId}`,
						flowCents,
						priorBalanceCents: priorBalance,
						runningBalanceCents: runningBalance,
					};
				});

				// Reverse for display (newest first)
				return Promise.resolve(Result.ok(ledgerEntries.reverse()));
			},
		},

		accounts: {
			list: () => Promise.resolve(Result.ok(accountRows)),
		},

		balances: {
			getBalances: () => {
				const balances = computeBalances(transactions);
				return Promise.resolve(Result.ok(balances));
			},
		},
	};
};

// Demo transactions for the zero-config init()
const makeDemoTransactions = (
	clock: Clock,
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

// Zero-config init for demo use
const init = (): Api => {
	const clock = { now: () => Math.floor(Date.now() / 1000) };
	const { categoryRows, categoryNameToId } = makeCategoryRows(clock);
	const { accountRows, accountNameToId } = makeAccountRows(
		clock,
		categoryNameToId,
	);
	const transactionRows = makeDemoTransactions(clock, accountNameToId);

	return buildApi(categoryRows, accountRows, transactionRows);
};

// Test helper: build Api with custom data using factory functions
const buildTestApi = (clock: Clock, config: TestApiConfig): Api => {
	const { categoryRows, categoryNameToId } = config.categories(clock);
	const { accountRows, accountNameToId } = config.accounts(
		clock,
		categoryNameToId,
	);
	const transactionRows = config.transactions(clock, accountNameToId);

	return buildApi(categoryRows, accountRows, transactionRows);
};

export const ApiFake = { init };
export { buildApi, buildTestApi };
export type { Clock, TestApiConfig };
