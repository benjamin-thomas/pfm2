import { readFileSync } from "node:fs";
import Database, { type Database as DB } from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import { makeSqlRepos, type Repos } from "../initRepos";
import { seedAllData } from "../seedData";
import type { TransactionRepo } from "./interface";

describe("TransactionRepoSql", () => {
	let db: DB;
	let repos: Repos;
	let repo: TransactionRepo;

	const getAccountId = (name: string): number => {
		const acc = repos.accountRepo.listAll().find((a) => a.name === name);
		if (!acc) throw new Error(`Account not found: ${name}`);
		return acc.id;
	};

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		repos = makeSqlRepos(db);
		seedAllData(repos);
		repo = repos.transactionRepo;
		repo.deleteAll();
	});

	afterEach(() => {
		db.close();
	});

	describe("create", () => {
		it("creates and returns transaction with generated id", () => {
			const tx = repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary",
				cents: 100000,
			});

			expect(tx).toMatchObject({
				id: 1,
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				descr: "Salary",
				cents: 100000,
			});
			expect(tx.createdAt).toBeTypeOf("number");
			expect(tx.updatedAt).toBeTypeOf("number");
		});
	});

	describe("findById", () => {
		it("returns Just(transaction) when found", () => {
			const created = repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary",
				cents: 100000,
			});

			const result = repo.findById(created.id);

			expect(result.tag).toBe("Just");
			Maybe.match(
				result,
				() => {
					throw new Error("Expected Just");
				},
				(tx) => {
					expect(tx.id).toBe(created.id);
					expect(tx.descr).toBe("Salary");
				},
			);
		});

		it("returns Nothing when not found", () => {
			const result = repo.findById(999);
			expect(result.tag).toBe("Nothing");
		});
	});

	describe("list", () => {
		beforeEach(() => {
			// Insert test transactions
			repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary January",
				cents: 100000,
			});
			repo.create({
				fromAccountId: getAccountId("Checking account"),
				toAccountId: getAccountId("Groceries"),
				date: 1700100000,
				descr: "Groceries",
				cents: 5000,
			});
			repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700200000,
				descr: "Salary February",
				cents: 100000,
			});
		});

		it("returns all transactions when no filters", () => {
			const txs = repo.list(Maybe.nothing);
			expect(txs).toHaveLength(3);
		});

		it("filters by fromAccountId", () => {
			const txs = repo.list(
				Maybe.just({ fromAccountId: getAccountId("Employer ABC") }),
			);
			expect(txs).toHaveLength(2);
			expect(
				txs.every((tx) => tx.fromAccountId === getAccountId("Employer ABC")),
			).toBe(true);
		});

		it("filters by toAccountId", () => {
			const txs = repo.list(
				Maybe.just({ toAccountId: getAccountId("Groceries") }),
			);
			expect(txs).toHaveLength(1);
			expect(txs[0].toAccountId).toBe(getAccountId("Groceries"));
		});

		it("filters by date range", () => {
			const txs = repo.list(
				Maybe.just({ startDate: 1700050000, endDate: 1700150000 }),
			);
			expect(txs).toHaveLength(1);
			expect(txs[0].descr).toBe("Groceries");
		});

		it("filters by search term", () => {
			const txs = repo.list(Maybe.just({ search: "salary" }));
			expect(txs).toHaveLength(2);
		});
	});

	describe("listByAccount", () => {
		it("returns transactions for account (from or to)", () => {
			repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary",
				cents: 100000,
			});
			repo.create({
				fromAccountId: getAccountId("Checking account"),
				toAccountId: getAccountId("Groceries"),
				date: 1700100000,
				descr: "Groceries",
				cents: 5000,
			});

			const txs = repo.listByAccount(getAccountId("Checking account"));

			expect(txs).toHaveLength(2);
		});
	});

	describe("update", () => {
		it("updates transaction and returns affectedRows: 1", () => {
			const created = repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary",
				cents: 100000,
			});

			const result = repo.update(created.id, {
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Updated Salary",
				cents: 110000,
			});

			expect(result).toEqual({ affectedRows: 1 });

			const updated = repo.findById(created.id);
			Maybe.match(
				updated,
				() => {
					throw new Error("Expected Just");
				},
				(tx) => {
					expect(tx.descr).toBe("Updated Salary");
					expect(tx.cents).toBe(110000);
				},
			);
		});

		it("returns affectedRows: 0 when not found", () => {
			const result = repo.update(999, {
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "X",
				cents: 1000,
			});
			expect(result).toEqual({ affectedRows: 0 });
		});
	});

	describe("delete", () => {
		it("deletes transaction and returns affectedRows: 1", () => {
			const created = repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary",
				cents: 100000,
			});

			const result = repo.delete(created.id);

			expect(result).toEqual({ affectedRows: 1 });
			expect(repo.findById(created.id).tag).toBe("Nothing");
		});

		it("returns affectedRows: 0 when not found", () => {
			const result = repo.delete(999);
			expect(result).toEqual({ affectedRows: 0 });
		});
	});

	describe("createMany", () => {
		it("bulk inserts and returns transactions", () => {
			const before = repo.list(Maybe.nothing).length;

			const created = repo.createMany([
				{
					fromAccountId: getAccountId("Employer ABC"),
					toAccountId: getAccountId("Checking account"),
					date: 1700000000,
					descr: "Salary 1",
					cents: 100000,
				},
				{
					fromAccountId: getAccountId("Employer ABC"),
					toAccountId: getAccountId("Checking account"),
					date: 1700100000,
					descr: "Salary 2",
					cents: 100000,
				},
			]);

			expect(created.length).toBe(2);
			expect(repo.list(Maybe.nothing).length).toBe(before + 2);
		});

		it("returns empty array for empty input", () => {
			const created = repo.createMany([]);
			expect(created).toEqual([]);
		});
	});

	describe("deleteAll", () => {
		it("removes all transactions", () => {
			repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700000000,
				descr: "Salary 1",
				cents: 100000,
			});
			repo.create({
				fromAccountId: getAccountId("Employer ABC"),
				toAccountId: getAccountId("Checking account"),
				date: 1700100000,
				descr: "Salary 2",
				cents: 100000,
			});

			expect(repo.list(Maybe.nothing)).toHaveLength(2);

			repo.deleteAll();

			expect(repo.list(Maybe.nothing)).toHaveLength(0);
		});
	});
});
