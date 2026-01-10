import type { Account, NewAccount } from "../../../shared/account";
import type { IO } from "../../../shared/io/interface";
import { Maybe } from "../../../shared/utils/maybe";
import type { AccountRepo, AffectedRows } from "./interface";

const init = (io: IO, initialAccounts: Account[]): AccountRepo => {
	const nowSecs = () => Math.floor(io.now() / 1000);
	const accounts: Account[] = [...initialAccounts];
	let nextId =
		accounts.length === 0 ? 1 : Math.max(...accounts.map((a) => a.id)) + 1;
	const hasPositionConflict = (
		position: number,
		ignoreId?: number,
	): boolean => {
		const accountsToCheck =
			ignoreId === undefined
				? accounts
				: accounts.filter((account) => account.id !== ignoreId);
		return accountsToCheck.some((account) => account.position === position);
	};

	return {
		listAll: (): Account[] => {
			return [...accounts].sort((a, b) => a.position - b.position);
		},

		findById: (id: number): Maybe<Account> => {
			const account = accounts.find((a) => a.id === id);
			return account ? Maybe.just(account) : Maybe.nothing;
		},

		create: (newAccount: NewAccount): Account => {
			if (hasPositionConflict(newAccount.position)) {
				throw new Error(
					`Account position ${newAccount.position} already exists`,
				);
			}
			const now = nowSecs();
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
			if (hasPositionConflict(updates.position, id)) {
				throw new Error(`Account position ${updates.position} already exists`);
			}

			const existing = accounts[index];
			const updated: Account = {
				...updates,
				id: existing.id,
				createdAt: existing.createdAt,
				updatedAt: nowSecs(),
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

		deleteAll: () => {
			const count = accounts.length;
			accounts.length = 0;
			return { affectedRows: count };
		},

		createMany: (newAccounts: NewAccount[]): Account[] => {
			const now = nowSecs();
			const usedPositions = new Set<number>();
			for (const account of newAccounts) {
				if (
					hasPositionConflict(account.position) ||
					usedPositions.has(account.position)
				) {
					throw new Error(
						`Account position ${account.position} already exists`,
					);
				}
				usedPositions.add(account.position);
			}
			const created: Account[] = newAccounts.map((acc) => ({
				...acc,
				id: nextId++,
				createdAt: now,
				updatedAt: now,
			}));
			accounts.push(...created);
			return created;
		},
	};
};

export const AccountRepoFake = { init } as const;
