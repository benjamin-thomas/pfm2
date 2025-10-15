// Generic Result type - follows Elm's Result API
// Result<X, A> where X is the error type, A is the success value type
// Error type comes first (more ergonomic for match - error handler first)

import { impossibleBranch } from './impossibleBranch';

export type Result<X, A> =
  | { tag: 'Ok'; value: A }
  | { tag: 'Err'; error: X };

const ok = <A>(value: A): Result<never, A> => ({ tag: 'Ok', value });

const err = <X>(error: X): Result<X, never> => ({ tag: 'Err', error });

// Match over a Result, an alternative to if checks
const match = <X, A, R>(
  result: Result<X, A>,
  onErr: (error: X) => R,
  onOk: (value: A) => R
): R => {
  switch (result.tag) {
    case 'Err':
      return onErr(result.error);
    case 'Ok':
      return onOk(result.value);

    /* v8 ignore next 2 */
    default:
      return impossibleBranch(result);
  }
};

/**
 * Transform the success value of a Result, leaving errors untouched.
 *
 * ```typescript
 * const result: Result<ApiError, Transaction> = ...;
 * const wrapped: Result<ApiError, Maybe<Transaction>> = Result.map(result, tx => Maybe.just(tx));
 * ```
 */
const map = <X, A, B>(
  result: Result<X, A>,
  fn: (value: A) => B
): Result<X, B> => {
  switch (result.tag) {
    case 'Err':
      return result;
    case 'Ok':
      return ok(fn(result.value));

    /* v8 ignore next 2 */
    default:
      return impossibleBranch(result);
  }
};

export const Result = { ok, err, match, map } as const;
