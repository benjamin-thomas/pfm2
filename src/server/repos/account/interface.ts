import type { Account, Category, NewAccount } from '../../../shared/account';
import type { Option } from '../../../shared/utils/option';

export type AffectedRows = { affectedRows: number };

export interface AccountRepo {
  listAll(): Promise<Account[]>;
  findById(id: number): Promise<Option<Account>>;
  create(account: NewAccount): Promise<Account>;
  update(id: number, account: NewAccount): Promise<AffectedRows>;
  remove(id: number): Promise<AffectedRows>;
}

export interface CategoryRepo {
  listAll(): Promise<Category[]>;
  findById(id: number): Promise<Option<Category>>;
}
