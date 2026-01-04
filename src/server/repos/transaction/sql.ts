// SQLite transaction repository implementation

import type { Database } from "better-sqlite3";
import {
	type NewTransaction,
	type Transaction,
	type TransactionFilters,
	transactionDecoder,
	transactionsDecoder,
	type UpdateTransaction,
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
		return transactionDecoder.guard(
			db
				.prepare(query)
				.get(tx.fromAccountId, tx.toAccountId, tx.date, tx.descr, tx.cents),
		);
	};

	const findById = (id: number): Maybe<Transaction> => {
		const query = `${baseSelect} WHERE transaction_id = ?`;
		const row = db.prepare(query).get(id);
		return row ? Maybe.just(transactionDecoder.guard(row)) : Maybe.nothing;
	};

	const list = (filters: Maybe<TransactionFilters>): Transaction[] => {
		return Maybe.match(
			filters,
			() => transactionsDecoder.guard(db.prepare(baseSelect).all()),
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
					return transactionsDecoder.guard(db.prepare(baseSelect).all());
				}

				const query = `${baseSelect} WHERE ${conditions.join(" AND ")}`;
				return transactionsDecoder.guard(db.prepare(query).all(...params));
			},
		);
	};

	const listByAccount = (accountId: number): Transaction[] => {
		const query = `${baseSelect} WHERE from_account_id = ? OR to_account_id = ?`;
		return transactionsDecoder.guard(
			db.prepare(query).all(accountId, accountId),
		);
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
		if (txs.length === 0) return [];

		const placeholders = txs.map(() => "(?, ?, ?, ?, ?)").join(", ");
		const query = `
			INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents)
			VALUES ${placeholders}
			RETURNING transaction_id AS id
			        , from_account_id AS fromAccountId
			        , to_account_id AS toAccountId
			        , date
			        , descr
			        , cents
			        , created_at AS createdAt
			        , updated_at AS updatedAt
		`;
		const params = txs.flatMap((tx) => [
			tx.fromAccountId,
			tx.toAccountId,
			tx.date,
			tx.descr,
			tx.cents,
		]);
		return transactionsDecoder.guard(db.prepare(query).all(...params));
	};

	const deleteAll = (): AffectedRows => {
		// noinspection SqlWithoutWhere
		const result = db.prepare("DELETE FROM transactions").run();
		return { affectedRows: result.changes };
	};

	return {
		create,
		findById,
		list,
		listByAccount,
		update,
		delete: del,
		createMany,
		deleteAll,
	};
};

export const TransactionRepoSql = { init } as const;
