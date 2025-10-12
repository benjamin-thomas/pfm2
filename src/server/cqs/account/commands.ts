// Account command handlers - write operations only
import type { Account, NewAccount } from '../../../shared/account';
import type { AccountRepo, AffectedRows } from '../../repos/account/interface';
import { Result } from '../../../shared/utils/result';

// No business rules yet, so no Result needed
const create = (repo: AccountRepo, data: NewAccount): Promise<Account> => {
  return repo.create(data);
};

const update = (
  repo: AccountRepo,
  id: number,
  data: NewAccount
): Promise<AffectedRows> => {
  return repo.update(id, data);
};

// Business rule example: Cannot delete "locked" accounts
// (Locked = name starts with "SYSTEM_")
type RemoveError = { tag: 'AccountLocked'; accountId: number; name: string };

const isLocked = (account: Account): boolean => {
  return account.name.startsWith('SYSTEM_');
};

const delete_ = async (
  repo: AccountRepo,
  id: number
): Promise<Result<RemoveError, AffectedRows>> => {
  const accountOpt = await repo.findById(id);

  if (accountOpt.tag === 'Nothing') {
    // Not found is not an error - just return 0 affected rows
    return Result.ok({ affectedRows: 0 });
  }

  if (isLocked(accountOpt.value)) {
    return Result.err({
      tag: 'AccountLocked',
      accountId: id,
      name: accountOpt.value.name,
    });
  }

  const affectedRows = await repo.delete(id);
  return Result.ok(affectedRows);
};

export const AccountCommand = {
  create,
  update,
  delete: delete_
} as const;
