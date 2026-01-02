// SQLite account repository implementation

import type { Database } from "better-sqlite3";
import type { Account, NewAccount } from "../../../shared/account";
import { Maybe } from "../../../shared/utils/maybe";
import type { AccountRepo, AffectedRows } from "./interface";

const init = (db: Database): AccountRepo => {
	const listAll = (): Account[] => {
		const query = `
			SELECT account_id AS id
			     , category_id AS categoryId
			     , name
			     , created_at AS createdAt
			     , updated_at AS updatedAt
			FROM accounts
		`;
		return db.prepare(query).all() as Account[];
	};

	const findById = (id: number): Maybe<Account> => {
		const query = `
			SELECT account_id AS id
			     , category_id AS categoryId
			     , name
			     , created_at AS createdAt
			     , updated_at AS updatedAt
			FROM accounts
			WHERE account_id = ?
		`;
		const row = db.prepare(query).get(id) as Account | undefined;
		return row ? Maybe.just(row) : Maybe.nothing;
	};

	const create = (account: NewAccount): Account => {
		const query = `
			INSERT INTO accounts (category_id, name)
			VALUES (?, ?)
			RETURNING account_id AS id
			        , category_id AS categoryId
			        , name
			        , created_at AS createdAt
			        , updated_at AS updatedAt
		`;
		return db.prepare(query).get(account.categoryId, account.name) as Account;
	};

	const update = (id: number, account: NewAccount): AffectedRows => {
		const query = `
			UPDATE accounts
			   SET category_id = ?
			     , name = ?
			WHERE account_id = ?
		`;
		const result = db.prepare(query).run(account.categoryId, account.name, id);
		return { affectedRows: result.changes };
	};

	const del = (id: number): AffectedRows => {
		const query = `DELETE FROM accounts WHERE account_id = ?`;
		const result = db.prepare(query).run(id);
		return { affectedRows: result.changes };
	};

	return { listAll, findById, create, update, delete: del };
};

export const AccountRepoSql = { init } as const;
