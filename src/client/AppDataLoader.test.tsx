import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { makeAccountRows, makeCategoryRows } from "../shared/fakeData";
import type { Transaction } from "../shared/transaction";
import { Result } from "../shared/utils/result";
import AppDataLoader from "./AppDataLoader";
import { buildTestApi } from "./api-client/fake";
import { I18nProvider } from "./i18n/context";

// Helper to unwrap Result or throw
const unwrapOrThrow = <X, A>(result: Result<X, A>): A => {
	return Result.match(
		result,
		(err) => {
			throw new Error(`Unexpected error: ${JSON.stringify(err)}`);
		},
		(value) => value,
	);
};

// Centralized test setup using shared fakeData
const clock = { now: () => 1000 };
const { categoryRows, categoryNameToId } = makeCategoryRows(clock);
const { accountRows, accountNameToId } = makeAccountRows(
	clock,
	categoryNameToId,
);

// Helper to get account ID by name
const accId = (name: string): number => {
	const id = accountNameToId.get(name);
	if (!id) throw new Error(`Unknown account: "${name}"`);
	return id;
};

// Account IDs from fakeData.ts for test assertions
const checkingId = accId("Checking account");
const employerId = accId("Employer ABC");
const groceriesId = accId("Groceries");
const clothingId = accId("Clothing");

// Helper to build test API with custom transactions
const makeTestApi = (
	transactionsFn: (accId: (name: string) => number) => Transaction[],
) => {
	const transactions = transactionsFn(accId);
	return buildTestApi(clock, {
		categories: () => ({ categoryRows, categoryNameToId }),
		accounts: () => ({ accountRows, accountNameToId }),
		transactions: () => transactions,
	});
};

describe("AppDataLoader", () => {
	afterEach(() => cleanup()); // must clean up manually to avoid "double renders"
	const noOp = () => {};

	it("renders transactions from fake API", async () => {
		const api = makeTestApi((accId) => [
			{
				id: 1,
				fromAccountId: accId("Employer ABC"),
				toAccountId: accId("Checking account"),
				date: 1,
				descr: "Salary",
				cents: 100000,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
			{
				id: 2,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 2,
				descr: "Supermarket",
				cents: 5000,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
		]);

		// Get accounts for initialAccounts prop
		const accountsResult = await api.accounts.list();
		const accounts = unwrapOrThrow(accountsResult);

		render(
			<I18nProvider>
				<AppDataLoader
					api={api}
					initialAccounts={accounts}
					selectedAccountId={checkingId}
					setSelectedAccountId={noOp}
				/>
			</I18nProvider>,
		);

		// Should show loading state initially
		screen.getByText(/loading financial data/i);

		// Wait for and verify seed data appears
		await screen.findByText(/Salary/);
		await screen.findByText(/Supermarket/);

		// Should show transaction count
		screen.getByText(/2 of 2 transactions/);

		// Verify we rendered balance cards for all accounts
		const balanceCards = screen.getAllByTestId(/^balance-card-/);
		expect(balanceCards).toHaveLength(accountRows.length);

		// Verify each balance card shows correct balance
		const checkingCard = screen.getByTestId(`balance-card-${checkingId}`);
		expect(checkingCard.getAttribute("data-test--balance")).toBe("95000");

		const employerCard = screen.getByTestId(`balance-card-${employerId}`);
		expect(employerCard.getAttribute("data-test--balance")).toBe("-100000");

		const groceriesCard = screen.getByTestId(`balance-card-${groceriesId}`);
		expect(groceriesCard.getAttribute("data-test--balance")).toBe("5000");
	});

	describe("account perspective switching", () => {
		const api = makeTestApi((accId) => [
			{
				id: 1,
				fromAccountId: accId("Employer ABC"),
				toAccountId: accId("Checking account"),
				date: 1,
				descr: "Salary",
				cents: 100000,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
			{
				id: 2,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 2,
				descr: "Supermarket",
				cents: 5000,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
			{
				id: 3,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Clothing"),
				date: 3,
				descr: "T-shirt",
				cents: 1000,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
			{
				id: 4,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 4,
				descr: "Supermarket 2",
				cents: 2500,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
		]);

		const expectCheckingBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${checkingId}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		const expectEmployerBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${employerId}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		const expectGroceriesBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${groceriesId}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		const expectClothingBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${clothingId}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		it("displays ledger from checking account perspective with correct balance movement", async () => {
			const expectedCheckingBalanceCents = "91500"; // 100000 - 5000 - 1000 - 2500

			const accountsResult = await api.accounts.list();
			const accounts = unwrapOrThrow(accountsResult);

			render(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={checkingId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for initial data to load - viewing from Checking account perspective
			await screen.findByText(/4 of 4 transactions/);

			// Verify all balance cards show correct balances
			expectCheckingBalance(expectedCheckingBalanceCents);
			expectEmployerBalance("-100000"); // Paid out salary
			expectGroceriesBalance("7500"); // 5000 + 2500
			expectClothingBalance("1000");

			// Verify first transaction row (most recent in display = date: 4, Supermarket 2)
			// From Checking perspective: -2500 cents (-25 €)
			const transactionList = screen.getByRole("list");
			const firstRow = transactionList.querySelector("li:first-child > button");
			if (!firstRow) throw new Error("firstRow not found");

			// Check balance-before (should be 94000: 100000 - 5000 - 1000)
			expect(firstRow.getAttribute("data-test--balance-before")).toBe("94000");

			// Check balance-after (should be 91500: 94000 - 2500)
			expect(firstRow.getAttribute("data-test--balance-after")).toBe(
				expectedCheckingBalanceCents,
			);
		});

		it("switches to groceries account perspective and updates ledger correctly", async () => {
			const expectedGroceriesBalanceCents = "7500";

			const accountsResult = await api.accounts.list();
			const accounts = unwrapOrThrow(accountsResult);

			const { rerender } = render(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={checkingId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for initial load
			await screen.findByText(/4 of 4 transactions/);

			// Verify all balance cards remain consistent
			expectCheckingBalance("91500");
			expectEmployerBalance("-100000");
			expectGroceriesBalance(expectedGroceriesBalanceCents);
			expectClothingBalance("1000");

			// Switch to Groceries account perspective
			rerender(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={groceriesId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for ledger to update (Groceries only appears in 2 transactions)
			await screen.findByText(/2 of 2 transactions/);

			// Verify all balance cards remain consistent
			expectCheckingBalance("91500");
			expectEmployerBalance("-100000");
			expectGroceriesBalance(expectedGroceriesBalanceCents);
			expectClothingBalance("1000");

			// Verify first transaction from Groceries perspective (most recent = date: 4, Supermarket 2)
			const transactionList = screen.getByRole("list");
			const firstRow = transactionList.querySelector("li:first-child > button");
			if (!firstRow) throw new Error("firstRow not found");

			// From Groceries perspective: +2500 cents
			expect(firstRow.getAttribute("data-test--balance-before")).toBe("5000");
			expect(firstRow.getAttribute("data-test--balance-after")).toBe(
				expectedGroceriesBalanceCents,
			);
		});
	});

	it("adds a new transaction and updates balances and ledger", async () => {
		const user = userEvent.setup();

		const api = makeTestApi((accId) => [
			{
				id: 1,
				fromAccountId: accId("Checking account"),
				toAccountId: accId("Groceries"),
				date: 1,
				descr: "Initial groceries",
				cents: 5000,
				createdAt: clock.now(),
				updatedAt: clock.now(),
			},
		]);

		const accountsResult = await api.accounts.list();
		const accounts = unwrapOrThrow(accountsResult);

		render(
			<I18nProvider>
				<AppDataLoader
					api={api}
					initialAccounts={accounts}
					selectedAccountId={checkingId}
					setSelectedAccountId={noOp}
				/>
			</I18nProvider>,
		);

		// Wait for initial load - should show 1 transaction
		await screen.findByTestId(`balance-card-${checkingId}`);

		// Verify initial balances
		const checkingCard = screen.getByTestId(`balance-card-${checkingId}`);
		expect(checkingCard.getAttribute("data-test--balance")).toBe("-5000"); // Spent 50€

		const groceriesCard = screen.getByTestId(`balance-card-${groceriesId}`);
		expect(groceriesCard.getAttribute("data-test--balance")).toBe("5000");

		// Click "Add Transaction" button
		const addButton = screen.getByTestId("add-transaction-button");
		await user.click(addButton);

		// Modal should be visible
		expect(screen.getByRole("dialog")).toBeTruthy();

		// Fill in the form
		const descriptionInput = screen.getByTestId("transaction-description");
		await user.type(descriptionInput, "Weekly shopping");

		const amountInput = screen.getByTestId("transaction-amount");
		await user.type(amountInput, "35.50");

		const fromSelect = screen.getByTestId("transaction-from-account");
		const toSelect = screen.getByTestId("transaction-to-account");

		// Change from default accounts to checking -> groceries
		await user.selectOptions(fromSelect, String(checkingId));
		await user.selectOptions(toSelect, String(groceriesId));

		// Disable HTML5 validation since happy-dom wrongly flags valid "steps"
		const form = screen.getByRole("dialog").querySelector("form");
		if (!form) throw new Error("Form not found");
		form.noValidate = true;

		// Submit the form
		const saveButton = screen.getByTestId("transaction-save");
		await user.click(saveButton);

		// Modal should be closed by now
		expect(screen.queryByRole("dialog")).toBeNull();

		// Verify groceries balance also updated
		const updatedGroceriesCard = screen.getByTestId(
			`balance-card-${groceriesId}`,
		);
		expect(updatedGroceriesCard.getAttribute("data-test--balance")).toBe(
			"8550",
		); // 5000 + 3550
	});

	describe("editing a transaction", () => {
		it("edits an existing transaction and updates balances", async () => {
			const user = userEvent.setup();

			const api = makeTestApi((accId) => [
				{
					id: 1,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: 1,
					descr: "Groceries v1",
					cents: 5000,
					createdAt: clock.now(),
					updatedAt: clock.now(),
				},
			]);

			const accountsResult = await api.accounts.list();
			const accounts = unwrapOrThrow(accountsResult);

			render(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={checkingId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for the transaction to appear (first transaction gets ID 1)
			const transactionRow = await screen.findByTestId("transaction-item--1");
			expect(transactionRow.getAttribute("data-test--descr")).toBe(
				"Groceries v1",
			);

			// Action: Click the transaction to open the modal
			await user.click(transactionRow);

			// Assertion: The modal should be pre-filled with the transaction data
			const descriptionInput = screen.getByTestId(
				"transaction-description",
			) as HTMLInputElement;
			expect(descriptionInput.value).toBe("Groceries v1");

			const amountInput = screen.getByTestId(
				"transaction-amount",
			) as HTMLInputElement;
			expect(amountInput.value).toBe("50.00");

			// Action: Edit the form
			await user.clear(descriptionInput);
			await user.type(descriptionInput, "Groceries v2");
			await user.clear(amountInput);
			await user.type(amountInput, "75.25");

			// Disable HTML5 validation to work around happy-dom bug
			const form = screen.getByRole("dialog").querySelector("form");
			if (!form) throw new Error("Form not found");
			form.noValidate = true;

			// Action: Save the changes
			const saveButton = screen.getByTestId("transaction-save");
			await user.click(saveButton);

			// Assertion: Modal should close
			expect(screen.queryByRole("dialog")).toBeNull();

			// Assertion: Verify the SAME transaction was updated (ID didn't change)
			const updatedRow = await screen.findByTestId("transaction-item--1");
			expect(updatedRow.getAttribute("data-test--descr")).toBe("Groceries v2");

			// Assertion: Balances should be updated correctly
			const updatedCheckingCard = screen.getByTestId(
				`balance-card-${checkingId}`,
			);
			expect(updatedCheckingCard.getAttribute("data-test--balance")).toBe(
				"-7525",
			);

			const updatedGroceriesCard = screen.getByTestId(
				`balance-card-${groceriesId}`,
			);
			expect(updatedGroceriesCard.getAttribute("data-test--balance")).toBe(
				"7525",
			);
		});

		it("handles deleting a transaction", async () => {
			const user = userEvent.setup();

			const api = makeTestApi((accId) => [
				{
					id: 1,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: 1,
					descr: "Groceries",
					cents: 5000,
					createdAt: clock.now(),
					updatedAt: clock.now(),
				},
			]);

			const accountsResult = await api.accounts.list();
			const accounts = unwrapOrThrow(accountsResult);

			render(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={checkingId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for transaction to appear and click it
			const transactionRow = await screen.findByTestId("transaction-item--1");
			await user.click(transactionRow);

			// Assert: Delete button should be visible in the modal
			const deleteButton = screen.getByTestId("transaction-delete");
			expect(deleteButton).toBeTruthy();
			expect(deleteButton.textContent).toMatch(/delete/i);

			// Click delete button
			await user.click(deleteButton);

			// Assert: Modal should show confirmation message
			screen.getByText(/delete this transaction/i);
			screen.getByText(/this action cannot be undone/i);

			// Assert: Should show transaction details recap
			const recapDescription = screen.getByTestId("delete-recap-description");
			expect(recapDescription.textContent).toBe("Groceries");

			const recapAmount = screen.getByTestId("delete-recap-amount");
			expect(recapAmount.textContent).toBe("50.00");

			// Assert: Original form fields should be hidden
			expect(screen.queryByTestId("transaction-description")).toBeNull();

			// Assert: Should have Cancel button in confirmation
			const confirmCancelButton = screen.getByTestId("delete-cancel");
			expect(confirmCancelButton.textContent).toMatch(/cancel/i);

			// Click cancel to go back to edit form
			await user.click(confirmCancelButton);

			// Assert: Should be back in edit form
			expect(screen.getByTestId("transaction-description"));
			expect(screen.queryByTestId("delete-recap-description")).toBeNull();

			// Click delete again to re-enter confirmation
			const deleteButtonAgain = screen.getByTestId("transaction-delete");
			await user.click(deleteButtonAgain);

			// Assert: Back in confirmation mode
			expect(screen.getByTestId("delete-recap-description"));

			// Assert: Should have Confirm Delete button
			const confirmButton = screen.getByTestId("transaction-delete-confirm");
			expect(confirmButton.textContent).toMatch(/confirm delete/i);

			// Click Confirm Delete
			await user.click(confirmButton);

			// Assert: Modal should be closed
			expect(screen.queryByRole("dialog")).toBeNull();

			// Assert: Transaction should be deleted from the list
			expect(screen.queryByTestId("transaction-item--1")).toBeNull();

			// Assert: Balances should be updated (back to zero since only transaction was deleted)
			const updatedCheckingCard = screen.getByTestId(
				`balance-card-${checkingId}`,
			);
			expect(updatedCheckingCard.getAttribute("data-test--balance")).toBe("0");

			const updatedGroceriesCard = screen.getByTestId(
				`balance-card-${groceriesId}`,
			);
			expect(updatedGroceriesCard.getAttribute("data-test--balance")).toBe("0");
		});
	});

	describe("reset data button", () => {
		it("resets data to demo state when clicked", async () => {
			const user = userEvent.setup();

			// Start with one seed transaction
			const api = makeTestApi((accId) => [
				{
					id: 1,
					fromAccountId: accId("Checking account"),
					toAccountId: accId("Groceries"),
					date: 1,
					descr: "Seed transaction",
					cents: 5000,
					createdAt: clock.now(),
					updatedAt: clock.now(),
				},
			]);

			const accountsResult = await api.accounts.list();
			const accounts = unwrapOrThrow(accountsResult);

			render(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={checkingId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for the seed transaction to appear
			await screen.findByText(/Seed transaction/);
			expect(screen.getByText(/1 of 1 transactions/)).toBeTruthy();

			// Add a new transaction via API (simulating user adding data)
			await api.transactions.create({
				fromAccountId: checkingId,
				toAccountId: groceriesId,
				date: 2,
				descr: "Added by user",
				cents: 1000,
			});

			// Click reset button
			const resetButton = screen.getByTestId("reset-data-button");
			await user.click(resetButton);

			// After reset, the added transaction should be gone
			// and we should be back to just the seed transaction
			await screen.findByText(/1 of 1 transactions/);
			expect(screen.getByText(/Seed transaction/)).toBeTruthy();
			expect(screen.queryByText(/Added by user/)).toBeNull();
		});
	});

	describe("error handling", () => {
		it("displays error when save fails and clears error when user edits field", async () => {
			const user = userEvent.setup();

			const api = makeTestApi(() => []);

			// Override create to always fail
			api.transactions.create = () =>
				Promise.resolve(
					Result.err({
						tag: "BadRequest",
						reason: "Unexpected condition ABC!",
					}),
				);

			const accountsResult = await api.accounts.list();
			const accounts = unwrapOrThrow(accountsResult);

			render(
				<I18nProvider>
					<AppDataLoader
						api={api}
						initialAccounts={accounts}
						selectedAccountId={checkingId}
						setSelectedAccountId={noOp}
					/>
				</I18nProvider>,
			);

			// Wait for initial load (wait for button that always renders)
			const addButton = await screen.findByTestId("add-transaction-button");

			// Open the add transaction modal
			await user.click(addButton);

			// Fill in the form
			const descriptionInput = screen.getByTestId("transaction-description");
			await user.type(descriptionInput, "Test transaction");

			const amountInput = screen.getByTestId("transaction-amount");
			await user.type(amountInput, "50.00");

			// Disable HTML5 validation
			const form = screen.getByRole("dialog").querySelector("form");
			if (!form) throw new Error("Form not found");
			form.noValidate = true;

			// Submit the form (will fail)
			const saveButton = screen.getByTestId("transaction-save");
			await user.click(saveButton);

			// Assert: Error message appears
			const errorBanner = await screen.findByText("Unexpected condition ABC!");
			expect(errorBanner).toBeTruthy();

			// Assert: Modal stays open
			expect(screen.getByRole("dialog")).toBeTruthy();

			// Action: User edits the description field
			await user.clear(descriptionInput);
			await user.type(descriptionInput, "Modified transaction");

			// Assert: Error banner disappears
			expect(screen.queryByText("Unexpected condition ABC!")).toBeNull();

			// Assert: Modal still open
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
	});
});
