// Fake transaction repository for testing - in-memory storage

import type {
	NewTransaction,
	Transaction,
	TransactionFilters,
	UpdateTransaction,
} from "../../../shared/transaction";
import { Maybe } from "../../../shared/utils/maybe";
import type { AffectedRows, TransactionRepo } from "./interface";

const init = (): TransactionRepo => {
	let transactions: Transaction[] = [];
	let nextId = 1;

	const createTransaction = (newTx: NewTransaction): Transaction => {
		const now = Math.floor(Date.now() / 1000);
		return {
			...newTx,
			id: nextId++,
			createdAt: now,
			updatedAt: now,
		};
	};

	const applyFilters = (
		txs: Transaction[],
		filters: Maybe<TransactionFilters>,
	): Transaction[] => {
		return Maybe.match(
			filters,
			() => txs, // No filters - return all
			(f) =>
				txs.filter((tx) => {
					if (f.fromAccountId && tx.fromAccountId !== f.fromAccountId)
						return false;
					if (f.toAccountId && tx.toAccountId !== f.toAccountId) return false;
					if (f.startDate && tx.date < f.startDate) return false;
					if (f.endDate && tx.date > f.endDate) return false;
					if (f.search) {
						const searchLower = f.search.toLowerCase();
						if (!tx.descr.toLowerCase().includes(searchLower)) {
							return false;
						}
					}
					return true;
				}),
		);
	};

	return {
		create: (transaction: NewTransaction): Transaction => {
			const newTx = createTransaction(transaction);
			transactions.push(newTx);
			return newTx;
		},

		findById: (id: number): Maybe<Transaction> => {
			const transaction = transactions.find((tx) => tx.id === id);
			return transaction ? Maybe.just(transaction) : Maybe.nothing;
		},

		list: (filters: Maybe<TransactionFilters>): Transaction[] => {
			return applyFilters(transactions, filters);
		},

		listByAccount: (accountId: number): Transaction[] => {
			return transactions.filter(
				(tx) => tx.fromAccountId === accountId || tx.toAccountId === accountId,
			);
		},

		update: (id: number, updates: UpdateTransaction): AffectedRows => {
			const index = transactions.findIndex((tx) => tx.id === id);
			if (index === -1) return { affectedRows: 0 };

			const existing = transactions[index];
			const updated: Transaction = {
				...updates,
				id: existing.id,
				createdAt: existing.createdAt,
				updatedAt: Math.floor(Date.now() / 1000),
			};
			transactions[index] = updated;
			return { affectedRows: 1 };
		},

		delete: (id: number): AffectedRows => {
			const index = transactions.findIndex((tx) => tx.id === id);
			if (index === -1) return { affectedRows: 0 };

			transactions.splice(index, 1);
			return { affectedRows: 1 };
		},

		createMany: (newTransactions: NewTransaction[]): Transaction[] => {
			const created = newTransactions.map((tx) => createTransaction(tx));
			transactions.push(...created);
			return created;
		},

		deleteMany: (ids: number[]): number => {
			const idSet = new Set(ids);
			const before = transactions.length;
			transactions = transactions.filter((tx) => !idSet.has(tx.id));
			return before - transactions.length;
		},
	};
};

// Factory with seed data
const initWithSeed = (): TransactionRepo => {
	const transactionRepo = init();

	const seedData: NewTransaction[] = [
		{
			fromAccountId: 5, // Employer
			toAccountId: 2, // Checking account
			date: Math.floor(new Date("2024-09-30").getTime() / 1000),
			descr: "Monthly Income",
			cents: 100000, // +1000.00 EUR
		},
		{
			fromAccountId: 2, // Checking account
			toAccountId: 6, // Unknown_EXPENSE
			date: Math.floor(new Date("2024-09-25").getTime() / 1000),
			descr: "Rent Payment",
			cents: 50000, // -500.00 EUR
		},
		{
			fromAccountId: 2, // Checking account
			toAccountId: 7, // Groceries
			date: Math.floor(new Date("2024-09-20").getTime() / 1000),
			descr: "Grocery Store",
			cents: 3400, // -34.00 EUR
		},
		{
			fromAccountId: 2, // Checking account
			toAccountId: 9, // Transport
			date: Math.floor(new Date("2024-09-18").getTime() / 1000),
			descr: "Gas Station",
			cents: 2500, // -25.00 EUR
		},
	];

	for (const tx of seedData) {
		transactionRepo.create(tx);
	}
	return transactionRepo;
};

export const TransactionRepoFake = { init, initWithSeed } as const;
