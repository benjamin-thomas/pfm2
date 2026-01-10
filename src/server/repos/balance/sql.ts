// SQLite balance repository implementation
import type Database from "better-sqlite3";
import {
	type AccountBalance,
	accountBalancesDecoder,
} from "../../../shared/account";
import type { BalanceRepo } from "./interface";

const init = (db: Database.Database): BalanceRepo => {
	const getBalances = (): AccountBalance[] => {
		const query = `
			SELECT a.account_id AS accountId
			     , a.category_id AS categoryId
			     , c.name AS categoryName
			     , a.name AS accountName
			     , a.position AS position
			     , COALESCE(x.added, 0) - COALESCE(x.removed, 0) AS balance
			FROM accounts AS a
			INNER JOIN categories AS c ON a.category_id = c.category_id
			LEFT JOIN (
			    SELECT account_id
			         , SUM(outgoing) AS removed
			         , SUM(incoming) AS added
			    FROM (
			        SELECT from_account_id AS account_id
			             , cents AS outgoing
			             , 0 AS incoming
			        FROM transactions

			        UNION ALL

			        SELECT to_account_id AS account_id
			             , 0 AS outgoing
			             , cents AS incoming
			        FROM transactions
			    )
			    GROUP BY account_id
			) x ON a.account_id = x.account_id
			WHERE COALESCE(x.added, 0) - COALESCE(x.removed, 0) != 0
			ORDER BY a.position ASC
		`;

		return accountBalancesDecoder.guard(db.prepare(query).all());
	};

	return { getBalances };
};

export const BalanceRepoSql = { init } as const;
