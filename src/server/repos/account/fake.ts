import type { Account, NewAccount } from "../../../shared/account";
import type { IO } from "../../../shared/io/interface";
import { Maybe } from "../../../shared/utils/maybe";
import type { AccountRepo, AffectedRows } from "./interface";

const init = (io: IO, initialAccounts: Account[]): AccountRepo => {
	const accounts: Account[] = [...initialAccounts];
	let nextId =
		accounts.length === 0 ? 1 : Math.max(...accounts.map((a) => a.id)) + 1;

	return {
		listAll: (): Account[] => {
			return accounts;
		},

		findById: (id: number): Maybe<Account> => {
			const account = accounts.find((a) => a.id === id);
			return account ? Maybe.just(account) : Maybe.nothing;
		},

		create: (newAccount: NewAccount): Account => {
			const now = io.now();
			const account: Account = {
				...newAccount,
				id: nextId++,
				createdAt: now,
				updatedAt: now,
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
				updatedAt: io.now(),
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
