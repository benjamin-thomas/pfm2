// Account query handlers - read operations only
//
// DESIGN NOTES:
// - Queries accept typed inputs (validation done at HTTP/CLI layer)
// - Queries return Result<DomainError, T> ONLY when business rules can fail
//   - Example: "User not authorized to view account" -> Result<AuthError, Account>
//   - Counter-example: Simple list/find with no rules -> Promise<Account[]>
// - Queries are thin wrappers for simple cases, but valuable for:
//   - Aggregate roots (joining data from multiple repos)
//   - Access control (filtering based on permissions)
//   - Complex filtering/sorting logic
// - Queries throw on unexpected errors (DB down, network failure)
// - Not found returns Option.none (not an error)
//
import type { Account } from '../../../shared/account';
import type { AccountRepo } from '../../repos/account/interface';
import { Option } from '../../../shared/utils/option';
import { Result } from '../../../shared/utils/result';

// No business rules, just pass through
export const list = (repo: AccountRepo): Promise<Account[]> => {
  return repo.listAll();
};

// Business rule example: Cannot view "hidden" accounts
// (Hidden = name starts with "HIDDEN_")
type FindByIdError = { tag: 'AccountHidden'; accountId: number };

const isHidden = (account: Account): boolean => {
  return account.name.startsWith('HIDDEN_');
};

export const findById = async (
  repo: AccountRepo,
  id: number
): Promise<Result<Option<Account>, FindByIdError>> => {
  const accountOpt = await repo.findById(id);

  if (accountOpt.tag === 'none') {
    // Not found is not an error - return none wrapped in ok
    return Result.ok(Option.none);
  }

  if (isHidden(accountOpt.value)) {
    return Result.err({ tag: 'AccountHidden', accountId: id });
  }

  return Result.ok(accountOpt);
};
