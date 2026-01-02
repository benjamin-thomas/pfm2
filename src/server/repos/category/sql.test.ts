import { readFileSync } from "node:fs";
import Database, { type Database as DB } from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import type { CategoryRepo } from "./interface";
import { CategoryRepoSql } from "./sql";

describe("CategoryRepoSql", () => {
	let db: DB;
	let repo: CategoryRepo;

	beforeEach(() => {
		db = new Database(":memory:");
		db.exec(readFileSync("sql/init.sql", "utf-8"));
		db.exec(readFileSync("sql/seed.sql", "utf-8"));
		repo = CategoryRepoSql.init(db);
	});

	afterEach(() => {
		db.close();
	});

	describe("listAll", () => {
		it("returns all 4 seeded categories", () => {
			const categories = repo.listAll();

			expect(categories).toHaveLength(4);
			expect(categories.map((c) => c.name)).toEqual([
				"Equity",
				"Assets",
				"Income",
				"Expenses",
			]);
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
});
