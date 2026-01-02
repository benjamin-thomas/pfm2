import type { Account, NewAccount } from "../../../shared/account";
import { accountRows } from "../../../shared/fakeData";
import { Maybe } from "../../../shared/utils/maybe";
import type { AccountRepo, AffectedRows } from "./interface";

const init = (): AccountRepo => {
	const accounts: Account[] = accountRows.map((row) => ({
		id: row.id,
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
			const account = accounts.find((a) => a.id === id);
			return account ? Maybe.just(account) : Maybe.nothing;
		},

		create: (newAccount: NewAccount): Account => {
			const account: Account = {
				...newAccount,
				id: nextId++,
				createdAt: Math.floor(Date.now() / 1000),
				updatedAt: Math.floor(Date.now() / 1000),
			};
			accounts.push(account);
			return account;
		},

		update: (id: number, updates: NewAccount): AffectedRows => {
			const index = accounts.findIndex((a) => a.id === id);
			if (index === -1) return { affectedRows: 0 };

			const existing = accounts[index];
			const updated: Account = {
				...updates,
				id: existing.id,
				createdAt: existing.createdAt,
				updatedAt: Math.floor(Date.now() / 1000),
			};
			accounts[index] = updated;
			return { affectedRows: 1 };
		},

		delete: (id: number): AffectedRows => {
			const index = accounts.findIndex((a) => a.id === id);
			if (index === -1) return { affectedRows: 0 };

			accounts.splice(index, 1);
			return { affectedRows: 1 };
		},
	};
};

export const AccountRepoFake = { init } as const;
