import type { Account, AccountBalance } from "../../shared/account";
import type { LedgerEntry } from "../../shared/ledger";
import type {
	NewTransaction,
	Transaction,
	UpdateTransaction,
} from "../../shared/transaction";
import type { Maybe } from "../../shared/utils/maybe";
import type { Result } from "../../shared/utils/result";

type ApiError =
	| { tag: "BadRequest"; reason: string }
	| { tag: "NotFound" }
	| { tag: "ServerError" };

const badRequest = (reason: string): ApiError => ({
	tag: "BadRequest",
	reason,
});
const notFound = { tag: "NotFound" } as const;
const serverError = { tag: "ServerError" } as const;

export const ApiErr = { badRequest, notFound, serverError } as const;

export interface Api {
	transactions: {
		list(params: {
			searchTerm: string;
		}): Promise<Result<ApiError, Transaction[]>>;
		findById(id: number): Promise<Result<ApiError, Maybe<Transaction>>>;
		create(transaction: NewTransaction): Promise<Result<ApiError, null>>;
		update(
			id: number,
			transaction: UpdateTransaction,
		): Promise<Result<ApiError, null>>;
		// Returns Result to handle cases where deletion might be forbidden (e.g., permissions, constraints)
		delete(id: number): Promise<Result<ApiError, null>>;
	};
	ledger: {
		getLedgerForAccount(
			accountId: number,
		): Promise<Result<ApiError, LedgerEntry[]>>;
	};
	accounts: {
		list(): Promise<Result<ApiError, Account[]>>;
	};
	balances: {
		getBalances(): Promise<Result<ApiError, AccountBalance[]>>;
	};
}

export type { ApiError };
