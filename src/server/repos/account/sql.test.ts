import { readFileSync } from "node:fs";
import Database, { type Database as DB } from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import { makeSqlRepos, type Repos } from "../initRepos";
import { seedAllData } from "../seedData";
import type { AccountRepo } from "./interface";

describe("AccountRepoSql", () => {
	let db: DB;
	let repos: Repos;
	let repo: AccountRepo;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		repos = makeSqlRepos(db);
		seedAllData(repos);
		repo = repos.accountRepo;
	});

	afterEach(() => {
		db.close();
	});

	describe("listAll", () => {
		it("returns seeded accounts", () => {
			const accounts = repo.listAll();
			expect(accounts.length).toBeGreaterThan(0);
		});

		it("returns accounts with correct shape", () => {
			const accounts = repo.listAll();
			const first = accounts[0];

			// First account is "Checking account" (the default)
			expect(first).toMatchObject({
				id: 1,
				name: "Checking account",
				categoryId: 2, // Assets
				position: 0,
			});
			expect(first.createdAt).toBeTypeOf("number");
			expect(first.updatedAt).toBeTypeOf("number");
		});
	});

	describe("findById", () => {
		it("returns Just(account) when found", () => {
			const result = repo.findById(2);

			expect(result.tag).toBe("Just");
			Maybe.match(
				result,
				() => {
					throw new Error("Expected Just");
				},
				(account) => {
					expect(account).toMatchObject({
						id: 2,
						name: "OpeningBalance",
						categoryId: 1, // Equity
					});
				},
			);
		});

		it("returns Nothing when not found", () => {
			const result = repo.findById(999);
			expect(result.tag).toBe("Nothing");
		});
	});

	describe("create", () => {
		it("creates and returns new account with generated id", () => {
			const account = repo.create({
				name: "New Account",
				categoryId: 2,
				position: 13,
			});

			expect(account).toMatchObject({
				id: 14, // After 13 seeded accounts
				name: "New Account",
				categoryId: 2,
			});
			expect(account.createdAt).toBeTypeOf("number");
			expect(account.updatedAt).toBeTypeOf("number");
		});

		it("persists the account", () => {
			const created = repo.create({
				name: "Persisted",
				categoryId: 3,
				position: 14,
			});
			const found = repo.findById(created.id);

			expect(found.tag).toBe("Just");
		});
	});

	describe("update", () => {
		it("updates account and returns affectedRows: 1", () => {
			const result = repo.update(2, {
				name: "Updated Name",
				categoryId: 3,
				position: 12,
			});

			expect(result).toEqual({ affectedRows: 1 });

			const updated = repo.findById(2);
			Maybe.match(
				updated,
				() => {
					throw new Error("Expected Just");
				},
				(account) => {
					expect(account.name).toBe("Updated Name");
					expect(account.categoryId).toBe(3);
				},
			);
		});

		it("returns affectedRows: 0 when not found", () => {
			const result = repo.update(999, {
				name: "X",
				categoryId: 1,
				position: 99,
			});
			expect(result).toEqual({ affectedRows: 0 });
		});
	});

	describe("delete", () => {
		it("deletes account and returns affectedRows: 1", () => {
			// Create a new account specifically for deletion test
			// (existing accounts may have transactions referencing them)
			const created = repo.create({
				name: "To Delete",
				categoryId: 1,
				position: 15,
			});

			const result = repo.delete(created.id);

			expect(result).toEqual({ affectedRows: 1 });

			const found = repo.findById(created.id);
			expect(found.tag).toBe("Nothing");
		});

		it("returns affectedRows: 0 when not found", () => {
			const result = repo.delete(999);
			expect(result).toEqual({ affectedRows: 0 });
		});
	});

	describe("deleteAll", () => {
		it("removes all accounts", () => {
			expect(repo.listAll().length).toBeGreaterThan(0);

			// Must delete transactions first (FK constraint)
			repos.transactionRepo.deleteAll();
			repo.deleteAll();

			expect(repo.listAll()).toHaveLength(0);
		});
	});

	describe("createMany", () => {
		it("creates and returns multiple accounts", () => {
			repos.transactionRepo.deleteAll();
			repo.deleteAll();

			const before = repo.listAll().length;
			const created = repo.createMany([
				{ name: "Account A", categoryId: 1, position: 16 },
				{ name: "Account B", categoryId: 2, position: 17 },
			]);

			expect(created.length).toBe(2);
			expect(repo.listAll().length).toBe(before + 2);
		});

		it("returns empty array for empty input", () => {
			const created = repo.createMany([]);
			expect(created).toEqual([]);
		});
	});
});
