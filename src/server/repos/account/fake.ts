import type { Account, Category, NewAccount } from "../../../shared/account";
import { accountRows, categoryRows } from "../../../shared/fakeData";
import { Maybe } from "../../../shared/utils/maybe";
import type { AccountRepo, AffectedRows, CategoryRepo } from "./interface";

const init = (): AccountRepo => {
	const accounts: Account[] = accountRows.map((row) => ({
		accountId: row.id,
		name: row.name,
		categoryId: row.categoryId,
		createdAt: 0,
		updatedAt: 0,
	}));
	let nextId = accountRows.length + 1;

	return {
		listAll: (): Account[] => {
			return accounts;
		},

		findById: (id: number): Maybe<Account> => {
			const account = accounts.find((a) => a.accountId === id);
			return account ? Maybe.just(account) : Maybe.nothing;
		},

		create: (newAccount: NewAccount): Account => {
			const account: Account = {
				...newAccount,
				accountId: nextId++,
				createdAt: Math.floor(Date.now() / 1000),
				updatedAt: Math.floor(Date.now() / 1000),
			};
			accounts.push(account);
			return account;
		},

		update: (id: number, updates: NewAccount): AffectedRows => {
			const index = accounts.findIndex((a) => a.accountId === id);
			if (index === -1) return { affectedRows: 0 };

			const existing = accounts[index];
			const updated: Account = {
				...updates,
				accountId: existing.accountId,
				createdAt: existing.createdAt,
				updatedAt: Math.floor(Date.now() / 1000),
			};
			accounts[index] = updated;
			return { affectedRows: 1 };
		},

		delete: (id: number): AffectedRows => {
			const index = accounts.findIndex((a) => a.accountId === id);
			if (index === -1) return { affectedRows: 0 };

			accounts.splice(index, 1);
			return { affectedRows: 1 };
		},
	};
};

export const AccountRepoFake = { init } as const;

const initCategory = (): CategoryRepo => {
	const categories: Category[] = categoryRows.map((row) => ({
		categoryId: row.id,
		name: row.name,
		createdAt: 0,
		updatedAt: 0,
	}));

	return {
		listAll: (): Category[] => {
			return categories;
		},

		findById: (id: number): Maybe<Category> => {
			const category = categories.find((c) => c.categoryId === id);
			return category ? Maybe.just(category) : Maybe.nothing;
		},
	};
};

export const CategoryRepoFake = { init: initCategory } as const;
