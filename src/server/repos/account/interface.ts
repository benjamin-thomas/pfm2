import type { Account, Category } from '../../../shared/account';

export interface AccountRepo {
  listAll(): Promise<Account[]>;
  findByIdOrNull(id: number): Promise<Account | null>;
}

export interface CategoryRepo {
  listAll(): Promise<Category[]>;
  findByIdOrNull(id: number): Promise<Category | null>;
}
