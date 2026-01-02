import { readFileSync } from "node:fs";
import Database, { type Database as DB } from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import type { AccountRepo } from "./interface";
import { AccountRepoSql } from "./sql";

describe("AccountRepoSql", () => {
	let db: DB;
	let repo: AccountRepo;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		db.exec(readFileSync("sql/seed.sql", "utf-8"));
		repo = AccountRepoSql.init(db);
	});

	afterEach(() => {
		db.close();
	});

	describe("listAll", () => {
		it("returns all 13 seeded accounts", () => {
			const accounts = repo.listAll();
			expect(accounts).toHaveLength(13);
		});

		it("returns accounts with correct shape", () => {
			const accounts = repo.listAll();
			const first = accounts[0];

			expect(first).toMatchObject({
				id: 1,
				name: "OpeningBalance",
				categoryId: 1,
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
						name: "Checking account",
						categoryId: 2,
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
			const account = repo.create({ name: "New Account", categoryId: 2 });

			expect(account).toMatchObject({
				id: 14, // After 13 seeded accounts
				name: "New Account",
				categoryId: 2,
			});
			expect(account.createdAt).toBeTypeOf("number");
			expect(account.updatedAt).toBeTypeOf("number");
		});

		it("persists the account", () => {
			const created = repo.create({ name: "Persisted", categoryId: 3 });
			const found = repo.findById(created.id);

			expect(found.tag).toBe("Just");
		});
	});

	describe("update", () => {
		it("updates account and returns affectedRows: 1", () => {
			const result = repo.update(2, { name: "Updated Name", categoryId: 3 });

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
			const result = repo.update(999, { name: "X", categoryId: 1 });
			expect(result).toEqual({ affectedRows: 0 });
		});
	});

	describe("delete", () => {
		it("deletes account and returns affectedRows: 1", () => {
			const result = repo.delete(13); // Leisure (last seeded account)

			expect(result).toEqual({ affectedRows: 1 });

			const found = repo.findById(13);
			expect(found.tag).toBe("Nothing");
		});

		it("returns affectedRows: 0 when not found", () => {
			const result = repo.delete(999);
			expect(result).toEqual({ affectedRows: 0 });
		});
	});
});
