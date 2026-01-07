import { describe, expect, it } from "vitest";
import {
	makeAccountRows,
	makeCategoryRows,
	makeDbDate,
} from "../../shared/fakeData";
import type { Transaction } from "../../shared/transaction";
import { Result } from "../../shared/utils/result";
import { buildApi } from "./fake";

describe("ApiFake", () => {
	const clock = { now: () => 0 };
	const { categoryRows, categoryNameToId } = makeCategoryRows(clock);
	const { accountRows, accountNameToId } = makeAccountRows(
		clock,
		categoryNameToId,
	);
	const accId = (name: string): number => {
		const id = accountNameToId.get(name);
		if (!id) throw new Error(`Unknown account: "${name}"`);
		return id;
	};

	describe("ledger.getLedgerForAccount", () => {
		it("orders same-day transactions by id for stable balance calculation", async () => {
			// Same date, different IDs - expense listed first in array (id=2), opening balance second (id=1)
			// This exposes the bug: without stable sorting by id, the order depends on array order
			const transactions: Transaction[] = [
				{
					id: 2,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: makeDbDate("2025-01-01"),
					descr: "Groceries",
					cents: 25000, // -250€
					createdAt: 0,
					updatedAt: 0,
				},
				{
					id: 1,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Checking account"),
					date: makeDbDate("2025-01-01"), // SAME DATE
					descr: "Opening Balance",
					cents: 100000, // +1000€
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const api = buildApi(categoryRows, accountRows, transactions);
			const result = await api.ledger.getLedgerForAccount(
				accId("Checking account"),
			);

			Result.match(
				result,
				() => {
					throw new Error("Expected Ok");
				},
				(entries) => {
					// DESC order (newest first by id since it's the same date)
					expect(entries[0].descr).toBe("Groceries"); // id=2, processed second
					expect(entries[0].priorBalanceCents).toBe(100000); // after opening balance
					expect(entries[0].runningBalanceCents).toBe(75000); // 1000 - 250 = 750€

					expect(entries[1].descr).toBe("Opening Balance"); // id=1, processed first
					expect(entries[1].priorBalanceCents).toBe(0);
					expect(entries[1].runningBalanceCents).toBe(100000);
				},
			);
		});

		it("sorts by date first, then by id within the same date", async () => {
			// IDs do NOT correlate with dates - this exposes the bug if sorting only by id
			// id=1 has the NEWEST date, id=3 has the OLDEST date
			const transactions: Transaction[] = [
				{
					id: 1,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: makeDbDate("2025-01-03"), // NEWEST DATE but the lowest id
					descr: "More Groceries",
					cents: 15000, // -150€
					createdAt: 0,
					updatedAt: 0,
				},
				{
					id: 3,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Checking account"),
					date: makeDbDate("2025-01-01"), // OLDEST DATE but the highest id
					descr: "Opening Balance",
					cents: 100000, // +1000€
					createdAt: 0,
					updatedAt: 0,
				},
				{
					id: 2,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: makeDbDate("2025-01-02"), // MIDDLE DATE
					descr: "Groceries",
					cents: 25000, // -250€
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const api = buildApi(categoryRows, accountRows, transactions);
			const result = await api.ledger.getLedgerForAccount(
				accId("Checking account"),
			);

			Result.match(
				result,
				() => {
					throw new Error("Expected Ok");
				},
				(entries) => {
					// DESC order by date (newest first)
					expect(entries[0].descr).toBe("More Groceries"); // Jan 3 (newest)
					expect(entries[0].priorBalanceCents).toBe(75000); // 1000 - 250
					expect(entries[0].runningBalanceCents).toBe(60000); // 750 - 150 = 600€

					expect(entries[1].descr).toBe("Groceries"); // Jan 2
					expect(entries[1].priorBalanceCents).toBe(100000);
					expect(entries[1].runningBalanceCents).toBe(75000);

					expect(entries[2].descr).toBe("Opening Balance"); // Jan 1 (oldest)
					expect(entries[2].priorBalanceCents).toBe(0);
					expect(entries[2].runningBalanceCents).toBe(100000);
				},
			);
		});
	});
});
