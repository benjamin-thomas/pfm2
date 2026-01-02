import type Database from "better-sqlite3";
import { Decoder } from "elm-decoders";
import type { LedgerEntry } from "../../../shared/ledger";
import type { LedgerRepo } from "./interface";

const ledgerRowDecoder: Decoder<LedgerEntry> = Decoder.object({
	id: Decoder.number,
	fromAccountId: Decoder.number,
	fromAccountName: Decoder.string,
	toAccountId: Decoder.number,
	toAccountName: Decoder.string,
	date: Decoder.number,
	descr: Decoder.string,
	cents: Decoder.number,
	createdAt: Decoder.number,
	updatedAt: Decoder.number,
	flowCents: Decoder.number,
	priorBalanceCents: Decoder.number,
	runningBalanceCents: Decoder.number,
});

const ledgerRowsDecoder = Decoder.array(ledgerRowDecoder);

const init = (db: Database.Database): LedgerRepo => {
	const getLedgerForAccount = (accountId: number): LedgerEntry[] => {
		const query = `
			SELECT x.id
			     , x.fromAccountId
			     , x.fromAccountName
			     , x.toAccountId
			     , x.toAccountName
			     , x.date
			     , x.descr
			     , x.cents
			     , x.createdAt
			     , x.updatedAt
			     , x.flowCents
			     , COALESCE(SUM(x.flowCents) OVER (ORDER BY x.date ASC, x.id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS priorBalanceCents
			     , SUM(x.flowCents) OVER (ORDER BY x.date ASC, x.id ASC) AS runningBalanceCents
			FROM (
			    SELECT t.transaction_id AS id
			         , t.from_account_id AS fromAccountId
			         , a.name AS fromAccountName
			         , t.to_account_id AS toAccountId
			         , b.name AS toAccountName
			         , t.date
			         , t.descr
			         , t.cents
			         , t.created_at AS createdAt
			         , t.updated_at AS updatedAt
			         , t.cents * CASE WHEN t.from_account_id = ? THEN -1 ELSE 1 END AS flowCents
			    FROM transactions AS t
			    INNER JOIN accounts AS a ON t.from_account_id = a.account_id
			    INNER JOIN accounts AS b ON t.to_account_id = b.account_id
			    WHERE t.to_account_id = ? OR t.from_account_id = ?
			) x
			ORDER BY x.date ASC, x.id ASC
		`;

		const rows = db.prepare(query).all(accountId, accountId, accountId);
		return ledgerRowsDecoder.guard(rows);
	};

	return { getLedgerForAccount };
};

export const LedgerRepoSql = { init } as const;
