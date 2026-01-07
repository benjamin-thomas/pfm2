import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { Decoder } from "elm-decoders";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeSqlRepos, type Repos } from "../initRepos";
import { seedAllData } from "../seedData";
import type { LedgerRepo } from "./interface";

const accountRowDecoder = Decoder.object({
	account_id: Decoder.number,
});

describe("LedgerRepoSql", () => {
	let db: Database.Database;
	let repos: Repos;
	let repo: LedgerRepo;

	const getAccountIdOrThrow = (name: string): number => {
		const result = db
			.prepare("SELECT account_id FROM accounts WHERE name = ?")
			.get(name);

		return accountRowDecoder.guard(result).account_id;
	};

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		repos = makeSqlRepos(db);
		seedAllData(repos);
		repo = repos.ledgerRepo;
		// Clear seeded transactions so tests start fresh
		repos.transactionRepo.deleteAll();
	});

	afterEach(() => {
		db.close();
	});

	it("returns empty array when no transactions exist for account", () => {
		const checkingId = getAccountIdOrThrow("Checking account");
		const ledger = repo.getLedgerForAccount(checkingId);
		expect(ledger).toEqual([]);
	});

	it("returns ledger entry with correct flow direction (outgoing)", () => {
		const checkingId = getAccountIdOrThrow("Checking account");
		const groceriesId = getAccountIdOrThrow("Groceries");

		// Insert transaction: Checking -> Groceries = 5000 cents (50€)
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 1700000000, "Food shopping", 5000);

		// View from Checking account perspective (money going OUT)
		const ledger = repo.getLedgerForAccount(checkingId);

		expect(ledger).toHaveLength(1);
		expect(ledger[0]).toMatchObject({
			fromAccountId: checkingId,
			fromAccountName: "Checking account",
			toAccountId: groceriesId,
			toAccountName: "Groceries",
			descr: "Food shopping",
			cents: 5000,
			flowCents: -5000, // Negative because money is leaving this account
		});
	});

	it("returns ledger entry with correct flow direction (incoming)", () => {
		const checkingId = getAccountIdOrThrow("Checking account");
		const employerId = getAccountIdOrThrow("Employer ABC");

		// Insert transaction: Employer ABC -> Checking = 100000 cents (1000€)
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(employerId, checkingId, 1700000000, "Salary", 100000);

		// View from Checking account perspective (money coming IN)
		const ledger = repo.getLedgerForAccount(checkingId);

		expect(ledger).toHaveLength(1);
		expect(ledger[0]).toMatchObject({
			fromAccountId: employerId,
			fromAccountName: "Employer ABC",
			toAccountId: checkingId,
			toAccountName: "Checking account",
			descr: "Salary",
			cents: 100000,
			flowCents: 100000, // Positive because money is entering this account
		});
	});

	it("calculates running balance across multiple transactions", () => {
		const checkingId = getAccountIdOrThrow("Checking account");
		const employerId = getAccountIdOrThrow("Employer ABC");
		const groceriesId = getAccountIdOrThrow("Groceries");

		// Transaction 1: Employer ABC -> Checking = 1000€ (date: day 1)
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(employerId, checkingId, 1, "Salary", 100000);

		// Transaction 2: Checking -> Groceries = 50€ (date: day 2)
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 2, "Food shopping", 5000);

		// Transaction 3: Checking -> Groceries = 30€ (date: day 3)
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 3, "More food", 3000);

		const ledger = repo.getLedgerForAccount(checkingId);

		expect(ledger).toHaveLength(3);

		// Results are in DESC order (newest first), but balances calculated in ASC order
		// Third (newest): -30€, prior = 950€, running = 920€
		expect(ledger[0]).toMatchObject({
			descr: "More food",
			flowCents: -3000,
			priorBalanceCents: 95000,
			runningBalanceCents: 92000,
		});

		// Second: -50€, prior = 1000€, running = 950€
		expect(ledger[1]).toMatchObject({
			descr: "Food shopping",
			flowCents: -5000,
			priorBalanceCents: 100000,
			runningBalanceCents: 95000,
		});

		// First (oldest): +1000€, prior = 0, running = 1000€
		expect(ledger[2]).toMatchObject({
			descr: "Salary",
			flowCents: 100000,
			priorBalanceCents: 0,
			runningBalanceCents: 100000,
		});
	});

	it("returns ledger entries in reverse chronological order (newest first)", () => {
		const checkingId = getAccountIdOrThrow("Checking account");
		const openingBalanceId = getAccountIdOrThrow("OpeningBalance");
		const groceriesId = getAccountIdOrThrow("Groceries");

		// Insert in random order to verify sorting
		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 2, "Expense 1", 5000); // middle

		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(openingBalanceId, checkingId, 1, "Opening Balance", 100000); // oldest

		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 3, "Expense 2", 3000); // newest

		const ledger = repo.getLedgerForAccount(checkingId);

		expect(ledger).toHaveLength(3);
		// Should be DESC order (newest first)
		expect(ledger[0].descr).toBe("Expense 2"); // date: 3
		expect(ledger[1].descr).toBe("Expense 1"); // date: 2
		expect(ledger[2].descr).toBe("Opening Balance"); // date: 1
	});

	it("maintains correct balance flow when returned in DESC order", () => {
		const checkingId = getAccountIdOrThrow("Checking account");
		const openingBalanceId = getAccountIdOrThrow("OpeningBalance");
		const groceriesId = getAccountIdOrThrow("Groceries");

		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(openingBalanceId, checkingId, 1, "Opening Balance", 100000);

		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 2, "Food", 5000);

		db.prepare(
			"INSERT INTO transactions (from_account_id, to_account_id, date, descr, cents) VALUES (?, ?, ?, ?, ?)",
		).run(checkingId, groceriesId, 3, "More food", 3000);

		const ledger = repo.getLedgerForAccount(checkingId);

		// DESC order but balance calculation was done in ASC
		// Entry 0: Most recent (More food) - should show final state
		expect(ledger[0]).toMatchObject({
			descr: "More food",
			flowCents: -3000,
			priorBalanceCents: 95000, // after opening balance and food
			runningBalanceCents: 92000, // final balance
		});

		// Entry 1: Middle (Food)
		expect(ledger[1]).toMatchObject({
			descr: "Food",
			flowCents: -5000,
			priorBalanceCents: 100000,
			runningBalanceCents: 95000,
		});

		// Entry 2: Oldest (Opening Balance)
		expect(ledger[2]).toMatchObject({
			descr: "Opening Balance",
			flowCents: 100000,
			priorBalanceCents: 0,
			runningBalanceCents: 100000,
		});
	});
});
