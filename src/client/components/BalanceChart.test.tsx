import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildApi } from "../api-client/fake.ts";
import { makeAccountRows, makeCategoryRows } from "../../shared/fakeData";
import type { LedgerEntry } from "../../shared/ledger";
import type { Transaction } from "../../shared/transaction";
import { Result } from "../../shared/utils/result";
import { I18nProvider } from "../i18n/context";
import { formatDateLocale } from "../i18n/translations";
import { BalanceChart, toChartData } from "./BalanceChart";

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

// Helper to get ledger entries from transactions using the fake API
const getLedgerEntries = async (
	transactions: Transaction[],
	accountName: string,
): Promise<LedgerEntry[]> => {
	const api = buildApi(categoryRows, accountRows, transactions);
	const result = await api.ledger.getLedgerForAccount(accId(accountName));
	return Result.match(
		result,
		() => {
			throw new Error("Failed to get ledger entries");
		},
		(entries) => entries,
	);
};

describe("BalanceChart", () => {
	afterEach(() => {
		cleanup();
	});

	describe("visibility based on data", () => {
		it("renders nothing when there are 0 ledger entries", () => {
			const { container } = render(
				<I18nProvider>
					<BalanceChart ledgerEntries={[]} accountName="Checking account" />
				</I18nProvider>,
			);

			expect(container.firstChild).toBeNull();
		});

		it("renders the chart when there is 1 ledger entry", async () => {
			const transactions: Transaction[] = [
				{
					id: 1,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Checking account"),
					date: 100,
					descr: "Opening Balance",
					cents: 100000,
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const entries = await getLedgerEntries(transactions, "Checking account");

			render(
				<I18nProvider>
					<BalanceChart
						ledgerEntries={entries}
						accountName="Checking account"
					/>
				</I18nProvider>,
			);

			expect(
				screen.getByText(/balance history for checking account/i),
			).toBeTruthy();
		});

		it("renders the chart when there are 2+ ledger entries", async () => {
			const transactions: Transaction[] = [
				{
					id: 1,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Checking account"),
					date: 100,
					descr: "Opening Balance",
					cents: 100000,
					createdAt: 0,
					updatedAt: 0,
				},
				{
					id: 2,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: 200,
					descr: "Groceries",
					cents: 5000,
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const entries = await getLedgerEntries(transactions, "Checking account");

			render(
				<I18nProvider>
					<BalanceChart
						ledgerEntries={entries}
						accountName="Checking account"
					/>
				</I18nProvider>,
			);

			expect(
				screen.getByText(/balance history for checking account/i),
			).toBeTruthy();
		});
	});

	describe("toChartData", () => {
		it("sorts same-day transactions by id for correct chart order", async () => {
			// Same date, different IDs
			// id=1: Opening Balance (+1000€)
			// id=2: Groceries (-50€)
			// Entries come in DESC order from the API (id=2 first, id=1 second)
			const transactions: Transaction[] = [
				{
					id: 1,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Checking account"),
					date: 100,
					descr: "Opening Balance",
					cents: 100000, // +1000€
					createdAt: 0,
					updatedAt: 0,
				},
				{
					id: 2,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: 100, // SAME DATE
					descr: "Groceries",
					cents: 5000, // -50€
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const entries = await getLedgerEntries(transactions, "Checking account");

			// Entries come in DESC order (id=2 first)
			expect(entries[0].id).toBe(2);
			expect(entries[1].id).toBe(1);

			const chartData = toChartData(entries, (ts) =>
				formatDateLocale("en", ts),
			);

			// Chart should sort ASC by date, then by id
			// So id=1 (Opening Balance) should come first
			expect(chartData[0].transactionId).toBe(1);
			expect(chartData[1].transactionId).toBe(2);
		});
	});

	describe("account name display", () => {
		it("displays the account name in the title", async () => {
			const transactions: Transaction[] = [
				{
					id: 1,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Savings account"),
					date: 100,
					descr: "Opening Balance",
					cents: 100000,
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const entries = await getLedgerEntries(transactions, "Savings account");

			render(
				<I18nProvider>
					<BalanceChart ledgerEntries={entries} accountName="Savings account" />
				</I18nProvider>,
			);

			expect(
				screen.getByText(/balance history for savings account/i),
			).toBeTruthy();
		});

		it("updates when account name changes", async () => {
			const transactions: Transaction[] = [
				{
					id: 1,
					fromAccountId: accId("OpeningBalance"),
					toAccountId: accId("Checking account"),
					date: 100,
					descr: "Opening Balance",
					cents: 100000,
					createdAt: 0,
					updatedAt: 0,
				},
			];

			const entries = await getLedgerEntries(transactions, "Checking account");

			const { rerender } = render(
				<I18nProvider>
					<BalanceChart
						ledgerEntries={entries}
						accountName="Checking account"
					/>
				</I18nProvider>,
			);

			expect(
				screen.getByText(/balance history for checking account/i),
			).toBeTruthy();

			rerender(
				<I18nProvider>
					<BalanceChart ledgerEntries={entries} accountName="Groceries" />
				</I18nProvider>,
			);

			expect(screen.getByText(/balance history for groceries/i)).toBeTruthy();
		});
	});
});
