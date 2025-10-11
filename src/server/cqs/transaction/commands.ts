// Transaction command handlers - write operations only
//
// DESIGN NOTES:
// - Commands accept typed inputs (validation done at HTTP/CLI layer)
// - Commands return Result<DomainError, T> ONLY when business rules can fail
//   - Example: "Cannot delete locked account" -> Result<RemoveError, AffectedRows>
//   - Counter-example: Simple CRUD with no rules -> Promise<AffectedRows>
// - Commands throw on unexpected errors (DB down, network failure, bugs)
// - Not found (affectedRows=0) is NOT an error - it's data-level feedback
//   - HTTP layer decides: 404 for REST semantics
//   - CLI layer decides: "Not found" message
//
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
