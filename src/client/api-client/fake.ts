import type { Account, AccountBalance } from "../../shared/account";
import type { LedgerEntry } from "../../shared/ledger";
import type {
	NewTransaction,
	Transaction,
	UpdateTransaction,
} from "../../shared/transaction";
import { validateTransaction } from "../../shared/transactionValidation";
import { Maybe } from "../../shared/utils/maybe";
import { Result } from "../../shared/utils/result";
import type { Api } from "./interface";
import { ApiErr } from "./interface";

// Fake API that maintains coherent state
// Balances are calculated from transactions, so they stay in sync

type SeedAccount = {
	id: number;
	name: string;
	categoryId: number;
};

type SeedCategory = {
	id: number;
	name: string;
};

type SeedData = {
	accounts: readonly SeedAccount[];
	categories: readonly SeedCategory[];
	transactions: readonly NewTransaction[];
};

const init = (seedData: SeedData): Api => {
	const {
		accounts: accountRows,
		categories: categoryRows,
		transactions: seedTransactions,
	} = seedData;
	let transactions: Transaction[] = [];
	let nextId = 1;

	// Initialize with provided seed data
	transactions = seedTransactions.map((tx) => ({
		...tx,
		transactionId: nextId++,
		createdAt: Math.floor(Date.now() / 1000),
		updatedAt: Math.floor(Date.now() / 1000),
	}));

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

				const balances = balanceMap.get(account.id) || { added: 0, removed: 0 };
				return {
					accountId: account.id,
					accountName: account.name,
					categoryId: category.id,
					categoryName: category.name,
					balance: balances.added - balances.removed,
				};
			})
			.filter((ab) => ab.balance !== 0);
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
				const tx = transactions.find((tx) => tx.transactionId === id);
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
								transactionId: nextId++,
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
				const index = transactions.findIndex((tx) => tx.transactionId === id);
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
								transactionId: existing.transactionId,
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
				const index = transactions.findIndex((tx) => tx.transactionId === id);
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
			list: () => {
				// Return all accounts from accountRows
				const accounts: Account[] = accountRows.map((account) => ({
					accountId: account.id,
					name: account.name,
					categoryId: account.categoryId,
					createdAt: 0,
					updatedAt: 0,
				}));
				return Promise.resolve(Result.ok(accounts));
			},
		},

		balances: {
			getBalances: () => {
				const balances = computeBalances(transactions);
				return Promise.resolve(Result.ok(balances));
			},
		},
	};
};

export const ApiFake = { init };
export type { SeedAccount, SeedCategory, SeedData };
