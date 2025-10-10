// SQLite account/category repository implementation
// TODO: Implement with better-sqlite3

import type { AccountRepo, CategoryRepo } from './interface';

const initAccount = (): AccountRepo => {
  throw new Error('AccountRepoSql.init not yet implemented');
};

const initCategory = (): CategoryRepo => {
  throw new Error('CategoryRepoSql.init not yet implemented');
};

export const AccountRepoSql = { init: initAccount } as const;
export const CategoryRepoSql = { init: initCategory } as const;
