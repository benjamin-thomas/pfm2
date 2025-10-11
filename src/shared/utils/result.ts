// Generic Result type - mimics Rust's Result<T, E> API
// Result<T, E> where T is the Ok value type, E is the Err error type

export type Result<T, E> =
  | { tag: 'Ok'; value: T }
  | { tag: 'Err'; error: E };

const ok = <T>(value: T): Result<T, never> => ({ tag: 'Ok', value });

const err = <E>(error: E): Result<never, E> => ({ tag: 'Err', error });

// Match/fold over Result - eliminates need for fragile if checks
// Usage: Result.match(result, onErr, onOk)
// Error handler first (like Rust's map_or_else), success handler second
const match = <T, E, R>(
  result: Result<T, E>,
  onErr: (error: E) => R,
  onOk: (value: T) => R
): R => {
  switch (result.tag) {
    case 'Err':
      return onErr(result.error);
    case 'Ok':
      return onOk(result.value);
    default: {
      const _exhaustive: never = result;
      throw new Error(`Unhandled Result tag: ${_exhaustive}`);
    }
  }
};

export const Result = { ok, err, match } as const;
