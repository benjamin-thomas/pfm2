// Transaction repository interface - behavioral contract

import type {
	NewTransaction,
	Transaction,
	TransactionFilters,
	UpdateTransaction,
} from "../../../shared/transaction";
import type { Maybe } from "../../../shared/utils/maybe";

export type AffectedRows = { affectedRows: number };

export interface TransactionRepo {
	// Create
	create(transaction: NewTransaction): Transaction;

	// Read
	findById(id: number): Maybe<Transaction>;
	list(filters: Maybe<TransactionFilters>): Transaction[];
	listByAccount(accountId: number): Transaction[];

	// Update
	update(id: number, updates: UpdateTransaction): AffectedRows;

	// Delete
	delete(id: number): AffectedRows;

	// Bulk operations
	createMany(transactions: NewTransaction[]): Transaction[];
	deleteAll(): AffectedRows;
}
