import { describe, expect, it } from "vitest";
import { makeAccountRows, makeCategoryRows } from "../../../shared/fakeData";
import { makeFakeIO } from "../../../shared/io/fake";
import type { Transaction } from "../../../shared/transaction";
import { AccountRepoFake } from "../account/fake";
import { TransactionRepoFake } from "../transaction/fake";
import { LedgerRepoFake } from "./fake";

describe("LedgerRepoFake", () => {
	const { io } = makeFakeIO({ now: 0 });
	const { categoryNameToId } = makeCategoryRows({ now: () => 0 });
	const { accountRows, accountNameToId } = makeAccountRows(
		{ now: () => 0 },
		categoryNameToId,
	);

	const accId = (name: string): number => {
		const id = accountNameToId.get(name);
		if (!id) throw new Error(`Unknown account: "${name}"`);
		return id;
	};

	it("returns ledger entries in DESC order (newest first)", () => {
		const transactions: Transaction[] = [
			{
				id: 1,
				fromAccountId: accId("OpeningBalance"),
				toAccountId: accId("Checking account"),
				date: 1,
				descr: "Opening Balance",
				cents: 100000,
				createdAt: 0,
				updatedAt: 0,
			},
			{
				id: 2,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 2,
				descr: "Expense 1",
				cents: 5000,
				createdAt: 0,
				updatedAt: 0,
			},
			{
				id: 3,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 3,
				descr: "Expense 2",
				cents: 3000,
				createdAt: 0,
				updatedAt: 0,
			},
		];

		const txRepo = TransactionRepoFake.init(io, transactions);
		const accRepo = AccountRepoFake.init(io, accountRows);
		const ledgerRepo = LedgerRepoFake.init(txRepo, accRepo);

		const ledger = ledgerRepo.getLedgerForAccount(accId("Checking account"));

		expect(ledger).toHaveLength(3);
		expect(ledger[0].descr).toBe("Expense 2"); // newest (date: 3)
		expect(ledger[1].descr).toBe("Expense 1"); // middle (date: 2)
		expect(ledger[2].descr).toBe("Opening Balance"); // oldest (date: 1)
	});

	it("maintains correct balance flow in DESC order", () => {
		const transactions: Transaction[] = [
			{
				id: 1,
				fromAccountId: accId("OpeningBalance"),
				toAccountId: accId("Checking account"),
				date: 1,
				descr: "Opening Balance",
				cents: 100000,
				createdAt: 0,
				updatedAt: 0,
			},
			{
				id: 2,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 2,
				descr: "Food",
				cents: 5000,
				createdAt: 0,
				updatedAt: 0,
			},
			{
				id: 3,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 3,
				descr: "More food",
				cents: 3000,
				createdAt: 0,
				updatedAt: 0,
			},
		];

		const txRepo = TransactionRepoFake.init(io, transactions);
		const accRepo = AccountRepoFake.init(io, accountRows);
		const ledgerRepo = LedgerRepoFake.init(txRepo, accRepo);

		const ledger = ledgerRepo.getLedgerForAccount(accId("Checking account"));

		// DESC order but balance calculated in ASC
		expect(ledger[0]).toMatchObject({
			descr: "More food",
			flowCents: -3000,
			priorBalanceCents: 95000,
			runningBalanceCents: 92000, // 950 - 30 = 920€
		});
		expect(ledger[1]).toMatchObject({
			descr: "Food",
			flowCents: -5000,
			priorBalanceCents: 100000,
			runningBalanceCents: 95000, // 1000 - 50 = 950€
		});
		expect(ledger[2]).toMatchObject({
			descr: "Opening Balance",
			flowCents: 100000,
			priorBalanceCents: 0,
			runningBalanceCents: 100000, // 0 + 1000 = 1000€
		});
	});
});
