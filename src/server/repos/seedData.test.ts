import { readFileSync } from "node:fs";
import Database, { type Database as DB } from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Maybe } from "../../shared/utils/maybe";
import { makeSqlRepos, type Repos } from "./initRepos";
import { resetAllData, seedAllData } from "./seedData";

describe("seedAllData", () => {
	let db: DB;
	let repos: Repos;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		repos = makeSqlRepos(db);
	});

	afterEach(() => {
		db.close();
	});

	it("creates categories", () => {
		expect(repos.categoryRepo.listAll().length).toBe(0);
		seedAllData(repos);
		expect(repos.categoryRepo.listAll().length).toBeGreaterThan(0);
	});

	it("creates accounts", () => {
		expect(repos.accountRepo.listAll().length).toBe(0);
		seedAllData(repos);
		expect(repos.accountRepo.listAll().length).toBeGreaterThan(0);
	});

	it("creates transactions", () => {
		expect(repos.transactionRepo.list(Maybe.nothing).length).toBe(0);
		seedAllData(repos);
		expect(repos.transactionRepo.list(Maybe.nothing).length).toBeGreaterThan(0);
	});
});

describe("resetAllData", () => {
	let db: DB;
	let repos: Repos;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		repos = makeSqlRepos(db);
		// Start with seeded data
		seedAllData(repos);
	});

	afterEach(() => {
		db.close();
	});

	it("clears existing data and re-seeds to demo state", () => {
		// Capture original seed counts
		const originalCategoryCount = repos.categoryRepo.listAll().length;
		const originalAccountCount = repos.accountRepo.listAll().length;
		const originalTransactionCount = repos.transactionRepo.list(
			Maybe.nothing,
		).length;

		// Add custom data
		repos.transactionRepo.create({
			fromAccountId: 1,
			toAccountId: 2,
			date: 1700000000,
			descr: "Custom transaction",
			cents: 12345,
		});

		// Verify we have more than demo data
		expect(repos.transactionRepo.list(Maybe.nothing)).toHaveLength(
			originalTransactionCount + 1,
		);

		// Reset
		resetAllData(repos);

		// Verify demo state restored
		expect(repos.categoryRepo.listAll()).toHaveLength(originalCategoryCount);
		expect(repos.accountRepo.listAll()).toHaveLength(originalAccountCount);
		expect(repos.transactionRepo.list(Maybe.nothing)).toHaveLength(
			originalTransactionCount,
		);
	});
});
