// SQLite balance repository implementation
// TODO: Implement with better-sqlite3 using the balance calculation SQL query

import type { BalanceRepo } from './interface';

const init = (): BalanceRepo => {
  throw new Error('BalanceRepoSql.init not yet implemented');
};

export const BalanceRepoSql = { init } as const;
