import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { LedgerEntry } from "../../shared/ledger";
import { BalanceChart } from "./BalanceChart";

// Helper to create ledger entries for testing
// Note: date is in seconds (Unix timestamp), not milliseconds
const makeLedgerEntry = (
	id: number,
	dateSeconds: number,
	runningBalanceCents: number,
): LedgerEntry => ({
	id,
	fromAccountId: 1,
	toAccountId: 2,
	date: dateSeconds,
	descr: `Transaction ${id}`,
	cents: 1000,
	createdAt: 1000,
	updatedAt: 1000,
	fromAccountName: "Checking",
	toAccountName: "Groceries",
	flowCents: -1000,
	priorBalanceCents: runningBalanceCents + 1000,
	runningBalanceCents,
});

describe("BalanceChart", () => {
	afterEach(() => {
		cleanup();
	});

	describe("visibility based on data", () => {
		it("renders nothing when there are 0 ledger entries", () => {
			const { container } = render(
				<BalanceChart ledgerEntries={[]} accountName="Checking" />,
			);

			expect(container.firstChild).toBeNull();
		});

		it("renders the chart when there is 1 ledger entry", () => {
			// Jan 1, 2024 00:00:00 UTC in seconds
			const entries = [makeLedgerEntry(1, 1704067200, 10000)];

			render(<BalanceChart ledgerEntries={entries} accountName="Checking" />);

			expect(screen.getByText(/balance history for checking/i)).toBeTruthy();
		});

		it("renders the chart when there are 2+ ledger entries", () => {
			const entries = [
				makeLedgerEntry(1, 1704067200, 10000),
				makeLedgerEntry(2, 1704153600, 9000),
			];

			render(<BalanceChart ledgerEntries={entries} accountName="Checking" />);

			expect(screen.getByText(/balance history for checking/i)).toBeTruthy();
		});
	});

	describe("account name display", () => {
		const entries = [
			makeLedgerEntry(1, 1704067200, 10000),
			makeLedgerEntry(2, 1704153600, 9000),
		];

		it("displays the account name in the title", () => {
			render(
				<BalanceChart ledgerEntries={entries} accountName="Savings account" />,
			);

			expect(
				screen.getByText(/balance history for savings account/i),
			).toBeTruthy();
		});

		it("updates when account name changes", () => {
			const { rerender } = render(
				<BalanceChart ledgerEntries={entries} accountName="Checking" />,
			);

			expect(screen.getByText(/balance history for checking/i)).toBeTruthy();

			rerender(
				<BalanceChart ledgerEntries={entries} accountName="Groceries" />,
			);

			expect(screen.getByText(/balance history for groceries/i)).toBeTruthy();
		});
	});
});
