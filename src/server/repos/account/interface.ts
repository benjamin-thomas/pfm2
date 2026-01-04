import type { Account, NewAccount } from "../../../shared/account";
import type { Maybe } from "../../../shared/utils/maybe";

export type AffectedRows = { affectedRows: number };

export interface AccountRepo {
	listAll(): Account[];
	findById(id: number): Maybe<Account>;
	create(account: NewAccount): Account;
	update(id: number, account: NewAccount): AffectedRows;
	delete(id: number): AffectedRows;
	deleteAll(): AffectedRows;
	createMany(accounts: NewAccount[]): Account[];
}
