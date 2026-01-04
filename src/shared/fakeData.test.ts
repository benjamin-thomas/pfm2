import { describe, expect, it } from "vitest";
import {
	makeAccountRows,
	makeCategoryRows,
	makeTransactionRows,
} from "./fakeData";

describe("fakeData", () => {
	const clock = { now: () => 1000 };

	describe("makeDemoTransactions", () => {
		it("returns demo transactions", () => {
			const { categoryNameToId } = makeCategoryRows(clock);
			const { accountNameToId } = makeAccountRows(clock, categoryNameToId);

			const transactions = makeTransactionRows(clock, accountNameToId);

			expect(transactions.length).toBeGreaterThan(0);
		});

		it("all transactions have required fields", () => {
			const { categoryNameToId } = makeCategoryRows(clock);
			const { accountNameToId } = makeAccountRows(clock, categoryNameToId);

			const transactions = makeTransactionRows(clock, accountNameToId);

			for (const tx of transactions) {
				expect(tx).toHaveProperty("id");
				expect(tx).toHaveProperty("fromAccountId");
				expect(tx).toHaveProperty("toAccountId");
				expect(tx).toHaveProperty("date");
				expect(tx).toHaveProperty("descr");
				expect(tx).toHaveProperty("cents");
				expect(tx).toHaveProperty("createdAt");
				expect(tx).toHaveProperty("updatedAt");
			}
		});

		it("transactions reference valid account IDs", () => {
			const { categoryNameToId } = makeCategoryRows(clock);
			const { accountRows, accountNameToId } = makeAccountRows(
				clock,
				categoryNameToId,
			);
			const validAccountIds = new Set(accountRows.map((a) => a.id));

			const transactions = makeTransactionRows(clock, accountNameToId);

			for (const tx of transactions) {
				expect(validAccountIds.has(tx.fromAccountId)).toBe(true);
				expect(validAccountIds.has(tx.toAccountId)).toBe(true);
			}
		});
	});
});
