// Account query handlers - read operations only
import type { Account } from '../../../shared/account';
import type { AccountRepo } from '../../repos/account/interface';
import { Maybe } from '../../../shared/utils/maybe';
import { Result } from '../../../shared/utils/result';

// No business rules, just pass through
const list = (repo: AccountRepo): Promise<Account[]> => {
  return repo.listAll();
};

// Business rule example: Cannot view "hidden" accounts
// (Hidden = name starts with "HIDDEN_")
type FindByIdError = { tag: 'AccountHidden'; accountId: number };

const isHidden = (account: Account): boolean => {
  return account.name.startsWith('HIDDEN_');
};

const findById = async (
  repo: AccountRepo,
  id: number
): Promise<Result<FindByIdError, Maybe<Account>>> => {
  const accountOpt = await repo.findById(id);

  if (accountOpt.tag === 'Nothing') {
    // Not found is not an error - return none wrapped in ok
    return Result.ok(Maybe.nothing);
  }

  if (isHidden(accountOpt.value)) {
    return Result.err({ tag: 'AccountHidden', accountId: id });
  }

  return Result.ok(accountOpt);
};

export const AccountQuery = {
  list,
  findById
} as const;
