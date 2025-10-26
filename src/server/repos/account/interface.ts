import type { Account, Category, NewAccount } from "../../../shared/account";
import type { Maybe } from "../../../shared/utils/maybe";

export type AffectedRows = { affectedRows: number };

export interface AccountRepo {
	listAll(): Promise<Account[]>;
	findById(id: number): Promise<Maybe<Account>>;
	create(account: NewAccount): Promise<Account>;
	update(id: number, account: NewAccount): Promise<AffectedRows>;
	delete(id: number): Promise<AffectedRows>;
}

export interface CategoryRepo {
	listAll(): Promise<Category[]>;
	findById(id: number): Promise<Maybe<Category>>;
}
