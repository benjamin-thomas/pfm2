// Account command handlers - write operations only
import type { Account, NewAccount } from '../../../shared/account';
import { Maybe } from '../../../shared/utils/maybe';
import { Result } from '../../../shared/utils/result';
import type { AccountRepo, AffectedRows } from '../../repos/account/interface';

// Business rule example: Cannot delete "locked" accounts
// (Locked = name starts with "SYSTEM_")
type RemoveError = { tag: 'AccountLocked'; accountId: number; name: string };

const isLocked = (account: Account): boolean => {
  return account.name.startsWith('SYSTEM_');
};

export type AccountCommand = {
  create(data: NewAccount): Promise<Account>;
  update(id: number, data: NewAccount): Promise<AffectedRows>;
  delete(id: number): Promise<Result<RemoveError, AffectedRows>>;
};

const init = (repo: AccountRepo): AccountCommand => {
  const create = (data: NewAccount): Promise<Account> => {
    return repo.create(data);
  };

  const update = (
    id: number,
    data: NewAccount
  ): Promise<AffectedRows> => {
    return repo.update(id, data);
  };

  const delete_ = async (
    id: number
  ): Promise<Result<RemoveError, AffectedRows>> => {
    const maybeAccount = await repo.findById(id);

    return Maybe.match(
      maybeAccount,
      // Not found is not an error - just return 0 affected rows
      async () => Result.ok({ affectedRows: 0 }),
      async (account) => {
        if (isLocked(account)) {
          return Result.err({
            tag: 'AccountLocked',
            accountId: id,
            name: account.name,
          });
        }
        const affectedRows = await repo.delete(id);
        return Result.ok(affectedRows);
      }
    );
  };

  return {
    create,
    update,
    delete: delete_
  };
};

export const AccountCommand = { init } as const;
