import { readFileSync } from "node:fs";
import Database, { type Database as DB } from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import { makeSqlRepos, type Repos } from "../initRepos";
import { seedAllData } from "../seedData";
import type { CategoryRepo } from "./interface";

describe("CategoryRepoSql", () => {
	let db: DB;
	let repos: Repos;
	let repo: CategoryRepo;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		repos = makeSqlRepos(db);
		seedAllData(repos);
		repo = repos.categoryRepo;
	});

	afterEach(() => {
		db.close();
	});

	describe("listAll", () => {
		it("returns seeded categories", () => {
			const categories = repo.listAll();
			expect(categories.length).toBeGreaterThan(0);
		});

		it("returns categories with correct shape", () => {
			const categories = repo.listAll();
			const first = categories[0];

			expect(first).toMatchObject({
				id: 1,
				name: "Equity",
			});
			expect(first.createdAt).toBeTypeOf("number");
			expect(first.updatedAt).toBeTypeOf("number");
		});
	});

	describe("findById", () => {
		it("returns Just(category) when found", () => {
			const result = repo.findById(2);

			expect(result.tag).toBe("Just");
			Maybe.match(
				result,
				() => {
					throw new Error("Expected Just");
				},
				(category) => {
					expect(category).toMatchObject({
						id: 2,
						name: "Assets",
					});
				},
			);
		});

		it("returns Nothing when not found", () => {
			const result = repo.findById(999);
			expect(result.tag).toBe("Nothing");
		});
	});

	describe("deleteAll", () => {
		it("removes all categories", () => {
			expect(repo.listAll().length).toBeGreaterThan(0);

			// Must delete in FK order: transactions -> accounts -> categories
			repos.transactionRepo.deleteAll();
			repos.accountRepo.deleteAll();
			repo.deleteAll();

			expect(repo.listAll()).toHaveLength(0);
		});
	});

	describe("createMany", () => {
		it("creates and returns multiple categories", () => {
			repos.transactionRepo.deleteAll();
			repos.accountRepo.deleteAll();
			repo.deleteAll();

			const before = repo.listAll().length;
			const created = repo.createMany([
				{ name: "Category A" },
				{ name: "Category B" },
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
