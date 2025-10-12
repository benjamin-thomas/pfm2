// Transaction command handlers - write operations only
import type { Transaction, NewTransaction, UpdateTransaction } from '../../../shared/transaction';
import type { TransactionRepo, AffectedRows } from '../../repos/transaction/interface';

// No business rules yet, so no Result needed
export const create = (
  repo: TransactionRepo,
  data: NewTransaction
): Promise<Transaction> => {
  return repo.create(data);
};

export const update = (
  repo: TransactionRepo,
  id: number,
  data: UpdateTransaction
): Promise<AffectedRows> => {
  return repo.update(id, data);
};

export const remove = (
  repo: TransactionRepo,
  id: number
): Promise<AffectedRows> => {
  return repo.remove(id);
};

export const createMany = (
  repo: TransactionRepo,
  transactions: NewTransaction[]
): Promise<Transaction[]> => {
  return repo.createMany(transactions);
};
