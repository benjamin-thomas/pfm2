// SQLite transaction repository implementation
// TODO: Implement with better-sqlite3

import type { TransactionRepo } from './interface';

const init = (): TransactionRepo => {
  throw new Error('TransactionRepoSql.init not yet implemented');
};

export const TransactionRepoSql = { init } as const;
