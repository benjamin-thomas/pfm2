// Transaction command handlers - write operations only
import type { Transaction, NewTransaction, UpdateTransaction } from '../../../shared/transaction';
import type { TransactionRepo, AffectedRows } from '../../repos/transaction/interface';

export type TransactionCommand = {
  create(data: NewTransaction): Promise<Transaction>;
  update(id: number, data: UpdateTransaction): Promise<AffectedRows>;
  delete(id: number): Promise<AffectedRows>;
  createMany(transactions: NewTransaction[]): Promise<Transaction[]>;
};

const init = (repo: TransactionRepo): TransactionCommand => {
  const create = (
    data: NewTransaction
  ): Promise<Transaction> => {
    return repo.create(data);
  };

  const update = (
    id: number,
    data: UpdateTransaction
  ): Promise<AffectedRows> => {
    return repo.update(id, data);
  };

  const delete_ = (
    id: number
  ): Promise<AffectedRows> => {
    return repo.delete(id);
  };

  const createMany = (
    transactions: NewTransaction[]
  ): Promise<Transaction[]> => {
    return repo.createMany(transactions);
  };

  return {
    create,
    update,
    delete: delete_,
    createMany
  };
};

export const TransactionCommand = { init } as const;
