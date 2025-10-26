import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Result } from "../shared/utils/result";
import AppDataLoader from "./AppDataLoader";
import {
	ApiFake,
	type SeedAccount,
	type SeedCategory,
} from "./api-client/fake";

describe("AppDataLoader", () => {
	afterEach(() => cleanup()); // must clean up manually to avoid "double renders"
	const noOp = () => {};

	// Helper to convert SeedAccount to Account
	const toAccounts = (seedAccounts: SeedAccount[]) =>
		seedAccounts.map((acc) => ({
			accountId: acc.id,
			categoryId: acc.categoryId,
			name: acc.name,
			createdAt: 0,
			updatedAt: 0,
		}));

	it("renders transactions from fake API", async () => {
		// Self-contained test data
		const income: SeedCategory = { id: 1, name: "Income" };
		const assets: SeedCategory = { id: 2, name: "Assets" };
		const expenses: SeedCategory = { id: 3, name: "Expenses" };

		// System accounts have negative IDs
		const unknownExpense: SeedAccount = {
			id: -1,
			name: "Unknown_EXPENSE",
			categoryId: expenses.id,
		};
		const unknownIncome: SeedAccount = {
			id: -2,
			name: "Unknown_INCOME",
			categoryId: income.id,
		};

		const employer: SeedAccount = {
			id: 1,
			name: "Employer ABC",
			categoryId: income.id,
		};
		const checking: SeedAccount = {
			id: 2,
			name: "Checking account",
			categoryId: assets.id,
		};
		const groceries: SeedAccount = {
			id: 3,
			name: "Groceries",
			categoryId: expenses.id,
		};

		const api = ApiFake.init({
			categories: [income, assets, expenses],
			accounts: [unknownExpense, unknownIncome, employer, checking, groceries],
			transactions: [
				{
					fromAccountId: employer.id,
					toAccountId: checking.id,
					date: 1,
					descr: "Salary",
					cents: 100000,
				},
				{
					fromAccountId: checking.id,
					toAccountId: groceries.id,
					date: 2,
					descr: "Supermarket",
					cents: 5000,
				},
			],
		});

		render(
			<AppDataLoader
				api={api}
				initialAccounts={toAccounts([unknownExpense, unknownIncome, employer, checking, groceries])}
				selectedAccountId={checking.id}
				setSelectedAccountId={noOp}
			/>,
		);

		// Should show loading state initially
		screen.getByText(/loading financial data/i);

		// Wait for and verify seed data appears
		await screen.findByText(/Salary/);
		await screen.findByText(/Supermarket/);

		// Should show transaction count
		screen.getByText(/2 of 2 transactions/);

		// Verify we rendered 5 balance cards (all accounts, including zero balances)
		const balanceCards = screen.getAllByTestId(/^balance-card-/);
		expect(balanceCards).toHaveLength(5);

		// Verify each balance card shows correct balance
		const checkingCard = screen.getByTestId(`balance-card-${checking.id}`);
		expect(checkingCard.getAttribute("data-test--balance")).toBe("95000");

		const employerCard = screen.getByTestId(`balance-card-${employer.id}`);
		expect(employerCard.getAttribute("data-test--balance")).toBe("-100000");

		const groceriesCard = screen.getByTestId(`balance-card-${groceries.id}`);
		expect(groceriesCard.getAttribute("data-test--balance")).toBe("5000");
	});

	describe("account perspective switching", () => {
		// Self-contained test data
		const income: SeedCategory = { id: 1, name: "Income" };
		const assets: SeedCategory = { id: 2, name: "Assets" };
		const expenses: SeedCategory = { id: 3, name: "Expenses" };

		// System accounts have negative IDs
		const unknownExpense: SeedAccount = {
			id: -1,
			name: "Unknown_EXPENSE",
			categoryId: expenses.id,
		};
		const unknownIncome: SeedAccount = {
			id: -2,
			name: "Unknown_INCOME",
			categoryId: income.id,
		};

		const checking: SeedAccount = {
			id: 100,
			name: "Checking account",
			categoryId: assets.id,
		};
		const employer: SeedAccount = {
			id: 200,
			name: "Employer ABC",
			categoryId: income.id,
		};
		const groceries: SeedAccount = {
			id: 300,
			name: "Groceries",
			categoryId: expenses.id,
		};
		const clothing: SeedAccount = {
			id: 400,
			name: "Clothing",
			categoryId: expenses.id,
		};

		// Transactions in chronological order (app displays in reverse)
		const api = ApiFake.init({
			categories: [income, assets, expenses],
			accounts: [
				unknownExpense,
				unknownIncome,
				checking,
				employer,
				groceries,
				clothing,
			],
			transactions: [
				{
					fromAccountId: employer.id,
					toAccountId: checking.id,
					date: 1,
					descr: "Salary",
					cents: 100000,
				},
				{
					fromAccountId: checking.id,
					toAccountId: groceries.id,
					date: 2,
					descr: "Supermarket",
					cents: 5000,
				},
				{
					fromAccountId: checking.id,
					toAccountId: clothing.id,
					date: 3,
					descr: "T-shirt",
					cents: 1000,
				},
				{
					fromAccountId: checking.id,
					toAccountId: groceries.id,
					date: 4,
					descr: "Supermarket 2",
					cents: 2500,
				},
			],
		});

		const expectCheckingBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${checking.id}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		const expectEmployerBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${employer.id}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		const expectGroceriesBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${groceries.id}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		const expectClothingBalance = (cents: string) => {
			const card = screen.getByTestId(`balance-card-${clothing.id}`);
			expect(card.getAttribute("data-test--balance")).toBe(cents);
		};

		it("displays ledger from checking account perspective with correct balance movement", async () => {
			const expectedCheckingBalanceCents = "91500"; // 100000 - 5000 - 1000 - 2500

			render(
				<AppDataLoader
					api={api}
					initialAccounts={toAccounts([unknownExpense, unknownIncome, checking, employer, groceries, clothing])}
					selectedAccountId={checking.id}
					setSelectedAccountId={noOp}
				/>,
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
			const { rerender } = render(
				<AppDataLoader
					api={api}
					initialAccounts={toAccounts([unknownExpense, unknownIncome, checking, employer, groceries, clothing])}
					selectedAccountId={checking.id}
					setSelectedAccountId={noOp}
				/>,
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
				<AppDataLoader
					api={api}
					initialAccounts={toAccounts([unknownExpense, unknownIncome, checking, employer, groceries, clothing])}
					selectedAccountId={groceries.id}
					setSelectedAccountId={noOp}
				/>,
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

		// Self-contained test data
		const income: SeedCategory = { id: 1, name: "Income" };
		const assets: SeedCategory = { id: 2, name: "Assets" };
		const expenses: SeedCategory = { id: 3, name: "Expenses" };

		// System accounts have negative IDs
		const unknownExpense: SeedAccount = {
			id: -1,
			name: "Unknown_EXPENSE",
			categoryId: expenses.id,
		};
		const unknownIncome: SeedAccount = {
			id: -2,
			name: "Unknown_INCOME",
			categoryId: income.id,
		};

		const checking: SeedAccount = {
			id: 1,
			name: "Checking account",
			categoryId: assets.id,
		};
		const groceries: SeedAccount = {
			id: 2,
			name: "Groceries",
			categoryId: expenses.id,
		};

		const api = ApiFake.init({
			categories: [income, assets, expenses],
			accounts: [unknownExpense, unknownIncome, checking, groceries],
			transactions: [
				{
					fromAccountId: checking.id,
					toAccountId: groceries.id,
					date: 1,
					descr: "Initial groceries",
					cents: 5000,
				},
			],
		});

		render(
			<AppDataLoader
				api={api}
				initialAccounts={toAccounts([unknownExpense, unknownIncome, checking, groceries])}
				selectedAccountId={checking.id}
				setSelectedAccountId={noOp}
			/>,
		);

		// Wait for initial load - should show 1 transaction
		await screen.findByTestId(`balance-card-${checking.id}`);

		// Verify initial balances
		const checkingCard = screen.getByTestId(`balance-card-${checking.id}`);
		expect(checkingCard.getAttribute("data-test--balance")).toBe("-5000"); // Spent 50€

		const groceriesCard = screen.getByTestId(`balance-card-${groceries.id}`);
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
		await user.selectOptions(fromSelect, "1");
		await user.selectOptions(toSelect, "2");

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
			`balance-card-${groceries.id}`,
		);
		expect(updatedGroceriesCard.getAttribute("data-test--balance")).toBe(
			"8550",
		); // 5000 + 3550
	});

	describe("editing a transaction", () => {
		it("edits an existing transaction and updates balances", async () => {
			const user = userEvent.setup();

			// Setup: Initial data with one transaction
			const assets: SeedCategory = { id: 1, name: "Assets" };
			const expenses: SeedCategory = { id: 2, name: "Expenses" };
			const unknownExpense: SeedAccount = {
				id: -1,
				name: "Unknown_EXPENSE",
				categoryId: expenses.id,
			};
			const unknownIncome: SeedAccount = {
				id: -2,
				name: "Unknown_INCOME",
				categoryId: expenses.id,
			}; // Note: category doesn't matter here
			const checking: SeedAccount = {
				id: 1,
				name: "Checking",
				categoryId: assets.id,
			};
			const groceries: SeedAccount = {
				id: 2,
				name: "Groceries",
				categoryId: expenses.id,
			};

			const api = ApiFake.init({
				categories: [assets, expenses],
				accounts: [checking, groceries, unknownExpense, unknownIncome],
				transactions: [
					{
						fromAccountId: checking.id,
						toAccountId: groceries.id,
						date: 1,
						descr: "Groceries v1",
						cents: 5000,
					},
				],
			});

			render(
				<AppDataLoader
					api={api}
					initialAccounts={toAccounts([checking, groceries, unknownExpense, unknownIncome])}
					selectedAccountId={checking.id}
					setSelectedAccountId={noOp}
				/>,
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
				`balance-card-${checking.id}`,
			);
			expect(updatedCheckingCard.getAttribute("data-test--balance")).toBe(
				"-7525",
			);

			const updatedGroceriesCard = screen.getByTestId(
				`balance-card-${groceries.id}`,
			);
			expect(updatedGroceriesCard.getAttribute("data-test--balance")).toBe(
				"7525",
			);
		});

		it("handles deleting a transaction", async () => {
			const user = userEvent.setup();

			// Setup: Initial data with one transaction
			const assets: SeedCategory = { id: 1, name: "Assets" };
			const expenses: SeedCategory = { id: 2, name: "Expenses" };
			const unknownExpense: SeedAccount = {
				id: -1,
				name: "Unknown_EXPENSE",
				categoryId: expenses.id,
			};
			const unknownIncome: SeedAccount = {
				id: -2,
				name: "Unknown_INCOME",
				categoryId: assets.id,
			};
			const checking: SeedAccount = {
				id: 1,
				name: "Checking",
				categoryId: assets.id,
			};
			const groceries: SeedAccount = {
				id: 2,
				name: "Groceries",
				categoryId: expenses.id,
			};

			const api = ApiFake.init({
				categories: [assets, expenses],
				accounts: [checking, groceries, unknownExpense, unknownIncome],
				transactions: [
					{
						fromAccountId: checking.id,
						toAccountId: groceries.id,
						date: 1,
						descr: "Groceries",
						cents: 5000,
					},
				],
			});

			render(
				<AppDataLoader
					api={api}
					initialAccounts={toAccounts([checking, groceries, unknownExpense, unknownIncome])}
					selectedAccountId={checking.id}
					setSelectedAccountId={noOp}
				/>,
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
				`balance-card-${checking.id}`,
			);
			expect(updatedCheckingCard.getAttribute("data-test--balance")).toBe("0");

			const updatedGroceriesCard = screen.getByTestId(
				`balance-card-${groceries.id}`,
			);
			expect(updatedGroceriesCard.getAttribute("data-test--balance")).toBe("0");
		});
	});

	describe("error handling", () => {
		it("displays error when save fails and clears error when user edits field", async () => {
			const user = userEvent.setup();

			// Setup: Basic seed data
			const assets: SeedCategory = { id: 1, name: "Assets" };
			const expenses: SeedCategory = { id: 2, name: "Expenses" };
			const unknownExpense: SeedAccount = {
				id: -1,
				name: "Unknown_EXPENSE",
				categoryId: expenses.id,
			};
			const unknownIncome: SeedAccount = {
				id: -2,
				name: "Unknown_INCOME",
				categoryId: assets.id,
			};
			const checking: SeedAccount = {
				id: 1,
				name: "Checking",
				categoryId: assets.id,
			};
			const groceries: SeedAccount = {
				id: 2,
				name: "Groceries",
				categoryId: expenses.id,
			};

			const api = ApiFake.init({
				categories: [assets, expenses],
				accounts: [checking, groceries, unknownExpense, unknownIncome],
				transactions: [],
			});

			// Override create to always fail
			api.transactions.create = () =>
				Promise.resolve(
					Result.err({
						tag: "BadRequest",
						reason: "Unexpected condition ABC!",
					}),
				);

			render(
				<AppDataLoader
					api={api}
					initialAccounts={toAccounts([checking, groceries, unknownExpense, unknownIncome])}
					selectedAccountId={checking.id}
					setSelectedAccountId={noOp}
				/>,
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
