// SQLite transaction repository implementation

import type { Database } from "better-sqlite3";
import type {
	NewTransaction,
	Transaction,
	TransactionFilters,
	UpdateTransaction,
} from "../../../shared/transaction";
import { Maybe } from "../../../shared/utils/maybe";
import type { AffectedRows, TransactionRepo } from "./interface";

const init = (db: Database): TransactionRepo => {
	const baseSelect = `
		SELECT transaction_id AS id
		     , from_account_id AS fromAccountId
		     , to_account_id AS toAccountId
		     , date
		     , descr
		     , cents
		     , created_at AS createdAt
		     , updated_at AS updatedAt
		FROM transactions
	`;

	const create = (tx: NewTransaction): Transaction => {
		const query = `
			INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents)
			VALUES (?, ?, ?, ?, ?)
			RETURNING transaction_id AS id
			        , from_account_id AS fromAccountId
			        , to_account_id AS toAccountId
			        , date
			        , descr
			        , cents
			        , created_at AS createdAt
			        , updated_at AS updatedAt
		`;
		return db
			.prepare(query)
			.get(
				tx.fromAccountId,
				tx.toAccountId,
				tx.date,
				tx.descr,
				tx.cents,
			) as Transaction;
	};

	const findById = (id: number): Maybe<Transaction> => {
		const query = `${baseSelect} WHERE transaction_id = ?`;
		const row = db.prepare(query).get(id) as Transaction | undefined;
		return row ? Maybe.just(row) : Maybe.nothing;
	};

	const list = (filters: Maybe<TransactionFilters>): Transaction[] => {
		return Maybe.match(
			filters,
			() => db.prepare(baseSelect).all() as Transaction[],
			(f) => {
				const conditions: string[] = [];
				const params: (string | number)[] = [];

				if (f.fromAccountId) {
					conditions.push("from_account_id = ?");
					params.push(f.fromAccountId);
				}
				if (f.toAccountId) {
					conditions.push("to_account_id = ?");
					params.push(f.toAccountId);
				}
				if (f.startDate) {
					conditions.push("date >= ?");
					params.push(f.startDate);
				}
				if (f.endDate) {
					conditions.push("date <= ?");
					params.push(f.endDate);
				}
				if (f.search) {
					conditions.push("LOWER(descr) LIKE ?");
					params.push(`%${f.search.toLowerCase()}%`);
				}

				if (conditions.length === 0) {
					return db.prepare(baseSelect).all() as Transaction[];
				}

				const query = `${baseSelect} WHERE ${conditions.join(" AND ")}`;
				return db.prepare(query).all(...params) as Transaction[];
			},
		);
	};

	const listByAccount = (accountId: number): Transaction[] => {
		const query = `${baseSelect} WHERE from_account_id = ? OR to_account_id = ?`;
		return db.prepare(query).all(accountId, accountId) as Transaction[];
	};

	const update = (id: number, tx: UpdateTransaction): AffectedRows => {
		const query = `
			UPDATE transactions
			   SET from_account_id = ?
			     , to_account_id = ?
			     , date = ?
			     , descr = ?
			     , cents = ?
			WHERE transaction_id = ?
		`;

		const result = db
			.prepare(query)
			.run(tx.fromAccountId, tx.toAccountId, tx.date, tx.descr, tx.cents, id);
		return { affectedRows: result.changes };
	};

	const del = (id: number): AffectedRows => {
		const query = `DELETE FROM transactions WHERE transaction_id = ?`;
		const result = db.prepare(query).run(id);
		return { affectedRows: result.changes };
	};

	const createMany = (txs: NewTransaction[]): Transaction[] => {
		const insertStmt = db.prepare(`
			INSERT INTO transactions 
				( from_account_id
				, to_account_id
				, date
				, descr
				, cents
				)
			VALUES ( ?
				   , ?
				   , ?
				   , ?
				   , ?
				   )
			RETURNING transaction_id AS id
			        , from_account_id AS fromAccountId
			        , to_account_id AS toAccountId
			        , date
			        , descr
			        , cents
			        , created_at AS createdAt
			        , updated_at AS updatedAt
		`);

		const insertAll = db.transaction((transactions: NewTransaction[]) => {
			return transactions.map(
				(tx) =>
					insertStmt.get(
						tx.fromAccountId,
						tx.toAccountId,
						tx.date,
						tx.descr,
						tx.cents,
					) as Transaction,
			);
		});

		return insertAll(txs);
	};

	const deleteMany = (ids: number[]): number => {
		if (ids.length === 0) return 0;

		const placeholders = ids.map(() => "?").join(", ");
		const query = `DELETE FROM transactions WHERE transaction_id IN (${placeholders})`;
		const result = db.prepare(query).run(...ids);
		return result.changes;
	};

	return {
		create,
		findById,
		list,
		listByAccount,
		update,
		delete: del,
		createMany,
		deleteMany,
	};
};

export const TransactionRepoSql = { init } as const;
