// Transaction command handlers - write operations only
import type { Transaction, NewTransaction, UpdateTransaction } from '../../../shared/transaction';
import type { TransactionRepo, AffectedRows } from '../../repos/transaction/interface';

// No business rules yet, so no Result needed
const create = (
  repo: TransactionRepo,
  data: NewTransaction
): Promise<Transaction> => {
  return repo.create(data);
};

const update = (
  repo: TransactionRepo,
  id: number,
  data: UpdateTransaction
): Promise<AffectedRows> => {
  return repo.update(id, data);
};

const delete_ = (
  repo: TransactionRepo,
  id: number
): Promise<AffectedRows> => {
  return repo.delete(id);
};

const createMany = (
  repo: TransactionRepo,
  transactions: NewTransaction[]
): Promise<Transaction[]> => {
  return repo.createMany(transactions);
};

export const TransactionCommand = {
  create,
  update,
  delete: delete_,
  createMany
} as const;
