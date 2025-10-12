// Generic Result type - follows Elm's Result API
// Result<X, A> where X is the error type, A is the success value type
// Error type comes first (more ergonomic for match - error handler first)

export type Result<X, A> =
  | { tag: 'Ok'; value: A }
  | { tag: 'Err'; error: X };

const ok = <A>(value: A): Result<never, A> => ({ tag: 'Ok', value });

const err = <X>(error: X): Result<X, never> => ({ tag: 'Err', error });

// Match/fold over Result - eliminates need for fragile if checks
// Usage: Result.match(result, onErr, onOk)
// Error handler first (ergonomic), success handler second
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
    default: {
      const exhaustive: never = result;
      throw new Error(`Impossible: ${exhaustive}`);
    }
  }
};

export const Result = { ok, err, match } as const;
