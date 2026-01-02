import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { Decoder } from "elm-decoders";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { BalanceRepo } from "./interface";
import { BalanceRepoSql } from "./sql";

const accountRowDecoder = Decoder.object({
	account_id: Decoder.number,
});

describe("BalanceRepoSql", () => {
	let db: Database.Database;
	let repo: BalanceRepo;

	const getAccountIdOrThrow = (name: string): number => {
		const result = db
			.prepare("SELECT account_id FROM accounts WHERE name = ?")
			.get(name);

		return accountRowDecoder.guard(result).account_id;
	};

	beforeEach(() => {
		db = new Database(":memory:");

		db.exec(readFileSync("sql/init.sql", "utf-8"));
		db.exec(readFileSync("sql/seed.sql", "utf-8"));

		repo = BalanceRepoSql.init(db);
	});

	afterEach(() => {
		db.close();
	});

	it("returns empty array when no transactions exist", () => {
		const balances = repo.getBalances();
		expect(balances).toEqual([]);
	});

	it("calculates balance for a single transaction", () => {
		// Insert one transaction: Checking -> Groceries = 50€
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(
			getAccountIdOrThrow("Checking account"),
			getAccountIdOrThrow("Groceries"),
			Date.now(),
			"Food shopping",
			5000,
		);

		const balances = repo.getBalances();

		// Should have 2 accounts with non-zero balance
		expect(balances).toHaveLength(2);

		// Checking lost 50€ (sent money out)
		const checking = balances.find((b) => b.accountName === "Checking account");
		expect(checking).toMatchObject({
			accountName: "Checking account",
			categoryName: "Assets",
			balance: -5000,
		});

		// Groceries gained 50€ (received money)
		const groceries = balances.find((b) => b.accountName === "Groceries");
		expect(groceries).toMatchObject({
			accountName: "Groceries",
			categoryName: "Expenses",
			balance: 5000,
		});
	});
});
