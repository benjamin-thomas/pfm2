// Account query handlers - read operations only
import type { Account } from "../../../shared/account";
import { Maybe } from "../../../shared/utils/maybe";
import { Result } from "../../../shared/utils/result";
import type { AccountRepo } from "../../repos/account/interface";

// Business rule example: Cannot view "hidden" accounts
// (Hidden = name starts with "HIDDEN_")
type FindByIdError = { tag: "AccountHidden"; accountId: number };

const isHidden = (account: Account): boolean => {
	return account.name.startsWith("HIDDEN_");
};

export type AccountQuery = {
	list(): Promise<Account[]>;
	findById(id: number): Promise<Result<FindByIdError, Maybe<Account>>>;
};

const init = (repo: AccountRepo): AccountQuery => {
	const list = (): Promise<Account[]> => {
		return repo.listAll();
	};

	const findById = async (
		id: number,
	): Promise<Result<FindByIdError, Maybe<Account>>> => {
		const maybeAccount = await repo.findById(id);

		return Maybe.match(
			maybeAccount,
			// Not found is not an error - return none wrapped in ok
			() => Result.ok(Maybe.nothing),
			(account) => {
				if (isHidden(account)) {
					return Result.err({ tag: "AccountHidden", accountId: id });
				}
				return Result.ok(Maybe.just(account));
			},
		);
	};

	return {
		list,
		findById,
	};
};

export const AccountQuery = { init } as const;
