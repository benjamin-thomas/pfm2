// Fake transaction repository for testing - in-memory storage

import type { IO } from "../../../shared/io/interface";
import type {
	NewTransaction,
	Transaction,
	TransactionFilters,
	UpdateTransaction,
} from "../../../shared/transaction";
import { Maybe } from "../../../shared/utils/maybe";
import type { AffectedRows, TransactionRepo } from "./interface";

const init = (io: IO, initialTransactions: Transaction[]): TransactionRepo => {
	const nowSecs = () => Math.floor(io.now() / 1000);
	let transactions: Transaction[] = [...initialTransactions];
	let nextId =
		transactions.length === 0
			? 1
			: Math.max(...transactions.map((tx) => tx.id)) + 1;

	const createTransaction = (newTx: NewTransaction): Transaction => {
		const now = nowSecs();
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
				updatedAt: nowSecs(),
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

		deleteAll: () => {
			const count = transactions.length;
			transactions = [];
			return { affectedRows: count };
		},
	};
};

export const TransactionRepoFake = { init } as const;
