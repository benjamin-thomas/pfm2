import type { Account, AccountBalance } from "../../shared/account";
import type { Category } from "../../shared/category";
import {
	makeAccountRows,
	makeCategoryRows,
	makeTransactionRows,
} from "../../shared/fakeData";
import type { LedgerEntry } from "../../shared/ledger";
import type { Transaction, UpdateTransaction } from "../../shared/transaction";
import { validateTransaction } from "../../shared/transactionValidation";
import { Maybe } from "../../shared/utils/maybe";
import { Result } from "../../shared/utils/result";
import { compareLedgerEntry } from "../../shared/ledger";
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
	// Store original seed data for reset
	const originalSeedTransactions = [...seedTransactions];

	// Mutable state
	let transactions: Transaction[] = [...seedTransactions];
	let nextId =
		transactions.length === 0
			? 1
			: Math.max(...transactions.map((tx) => tx.id)) + 1;

	// Reset function to restore to original state
	const resetToSeedState = (): void => {
		transactions = [...originalSeedTransactions];
		nextId =
			transactions.length === 0
				? 1
				: Math.max(...transactions.map((tx) => tx.id)) + 1;
	};

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
		return accountRows
			.map((account) => {
				const category = categoryRows.find(
					(cat) => cat.id === account.categoryId,
				);
				if (!category) {
					throw new Error(`Category not found for account ${account.name}`);
				}

				const balances = balanceMap.get(account.id) || {
					added: 0,
					removed: 0,
				};
				return {
					accountId: account.id,
					accountName: account.name,
					categoryId: category.id,
					categoryName: category.name,
					position: account.position,
					balance: balances.added - balances.removed,
				};
			})
			.sort((a, b) => a.position - b.position);
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
							return Result.ok(null);
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
							return Result.ok(null);
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
				return Promise.resolve(Result.ok(null));
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

				relevantTransactions.sort(compareLedgerEntry);

				// Transform to ledger entries with flow and running balance
				let runningBalance = 0;
				const ledgerEntries: LedgerEntry[] = relevantTransactions.map((tx) => {
					// Calculate flow from the perspective of the selected account
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
			list: () =>
				Promise.resolve(
					Result.ok([...accountRows].sort((a, b) => a.position - b.position)),
				),
		},

		balances: {
			getBalances: () => {
				const balances = computeBalances(transactions);
				return Promise.resolve(Result.ok(balances));
			},
		},

		admin: {
			resetData: () => {
				resetToSeedState();
				return Promise.resolve(Result.ok(null));
			},
		},
	};
};

// Zero-config init for demo use
const init = (): Api => {
	const clock = { now: () => Date.now() };
	const { categoryRows, categoryNameToId } = makeCategoryRows(clock);
	const { accountRows, accountNameToId } = makeAccountRows(
		clock,
		categoryNameToId,
	);
	const transactionRows = makeTransactionRows(clock, accountNameToId);

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
