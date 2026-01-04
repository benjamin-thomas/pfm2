import * as FakeData from "../../shared/fakeData";

import type { NewAccount } from "../../shared/account";
import type { NewCategory } from "../../shared/category";
import type { NewTransaction } from "../../shared/transaction";
import type { Repos } from "./initRepos";

export const seedAllData = (repos: Repos): void => {
	console.log("[seedAllData] Starting seed...");
	const clock = { now: () => Date.now() };

	// Get the category definitions (we only need names)
	const { categoryRows } = FakeData.makeCategoryRows(clock);
	const newCategoryNames: NewCategory[] = categoryRows.map(({ name }) => ({
		name,
	}));

	// Create categories and build the name-to-id map
	const createdCategories = repos.categoryRepo.createMany(newCategoryNames);
	console.log(`[seedAllData] Created ${createdCategories.length} categories`);
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
	console.log(`[seedAllData] Created ${createdAccounts.length} accounts`);
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
	const createdTxs = repos.transactionRepo.createMany(newTransactions);
	console.log(`[seedAllData] Created ${createdTxs.length} transactions`);
	console.log("[seedAllData] Seed complete");
};

// Clear all data and re-seed to demo state
// Delete order matters due to FK constraints: transactions → accounts → categories
export const resetAllData = (repos: Repos): void => {
	console.log("[resetAllData] Starting reset...");
	const txResult = repos.transactionRepo.deleteAll();
	console.log(`[resetAllData] Deleted ${txResult.affectedRows} transactions`);
	const accResult = repos.accountRepo.deleteAll();
	console.log(`[resetAllData] Deleted ${accResult.affectedRows} accounts`);
	const catResult = repos.categoryRepo.deleteAll();
	console.log(`[resetAllData] Deleted ${catResult.affectedRows} categories`);
	seedAllData(repos);
	console.log("[resetAllData] Reset complete");
};
