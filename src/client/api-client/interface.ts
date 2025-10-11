import type { Transaction, NewTransaction, UpdateTransaction } from '../../shared/transaction';
import type { AccountBalance } from '../../shared/account';
import type { Result } from '../../shared/utils/result';
import type { Option } from '../../shared/utils/option';

type ApiError
  = { tag: 'BadRequest', reason: string }
  | { tag: 'NotFound' }
  | { tag: 'ServerError' }

const badRequest = (reason: string): ApiError => ({ tag: 'BadRequest', reason });
const notFound = { tag: 'NotFound' } as const;
const serverError = { tag: 'ServerError' } as const;

export const ApiErr = { badRequest, notFound, serverError } as const;

export interface Api {
  transactions: {
    list(params: { budgetId: number }): Promise<Result<Transaction[], ApiError>>;
    findById(id: number): Promise<Result<Option<Transaction>, ApiError>>;
    create(transaction: NewTransaction): Promise<Result<Transaction, ApiError>>;
    update(id: number, transaction: UpdateTransaction): Promise<Result<Transaction, ApiError>>;
    // Returns Result to handle cases where deletion might be forbidden (e.g., permissions, constraints)
    delete(id: number): Promise<Result<void, ApiError>>;
  };
  balances: {
    getBalances(params: { budgetId: number }): Promise<Result<AccountBalance[], ApiError>>;
  };
}

export type { ApiError };
