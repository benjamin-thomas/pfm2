import * as FakeData from "../../shared/fakeData";

import type { NewAccount } from "../../shared/account";
import type { NewCategory } from "../../shared/category";
import type { NewTransaction } from "../../shared/transaction";
import type { Repos } from "./initRepos";

export const seedAllData = (repos: Repos): void => {
	const clock = { now: () => Date.now() };

	// Get the category definitions (we only need names)
	const { categoryRows } = FakeData.makeCategoryRows(clock);
	const newCategoryNames: NewCategory[] = categoryRows.map(({ name }) => ({
		name,
	}));

	// Create categories and build the name-to-id map
	const createdCategories = repos.categoryRepo.createMany(newCategoryNames);
	const categoryNameToId = new Map<string, number>(
		createdCategories.map((cat) => [cat.name, cat.id]),
	);

	// Get account definitions
	const { accountRows } = FakeData.makeAccountRows(clock, categoryNameToId);
	const newAccounts: NewAccount[] = accountRows.map(({ name, categoryId }) => ({
		name,
		categoryId,
	}));

	// Create accounts and build the name-to-id map
	const createdAccounts = repos.accountRepo.createMany(newAccounts);
	const accountNameToId = new Map<string, number>(
		createdAccounts.map((acc) => [acc.name, acc.id]),
	);

	// Get transaction definitions (using demo transactions for rich data)
	const transactionRows = FakeData.makeTransactionRows(clock, accountNameToId);
	const newTransactions: NewTransaction[] = transactionRows.map(
		({ fromAccountId, toAccountId, date, descr, cents }) => ({
			fromAccountId,
			toAccountId,
			date,
			descr,
			cents,
		}),
	);

	// Create transactions
	repos.transactionRepo.createMany(newTransactions);
};

// Clear all data and re-seed to demo state
// Delete order matters due to FK constraints: transactions → accounts → categories
export const resetAllData = (repos: Repos): void => {
	repos.transactionRepo.deleteAll();
	repos.accountRepo.deleteAll();
	repos.categoryRepo.deleteAll();
	seedAllData(repos);
};
