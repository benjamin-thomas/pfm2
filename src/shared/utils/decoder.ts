import type { DecoderError, DecoderResult } from 'tiny-decoders';
import { Result } from './result';

/**
 * Pattern matching for decoder results
 * Similar to Maybe.match and Result.match
 */
const match = <A, B>(
  result: DecoderResult<A>,
  onError: (error: DecoderError) => B,
  onValid: (value: A) => B
): B => {
  switch (result.tag) {
    case 'DecoderError':
      return onError(result.error);
    case 'Valid':
      return onValid(result.value);
  }
};

/**
 * Converts a DecoderResult to a Result, transforming the error type.
 *
 * Prefer this over `match` when returning Results, as TypeScript cannot infer
 * union types from both branches:
 *
 * ```typescript
 * // ❌ Fails - TypeScript can't unify the two Result types
 * Decoder.match(decoded,
 *   (err) => Result.err(apiError),  // Result<ApiError, never>
 *   (val) => Result.ok(val)         // Result<never, Transaction[]>
 * );
 *
 * // ⚠️ Works but verbose - requires explicit type annotation
 * Decoder.match<Transaction[], Result<ApiError, Transaction[]>>(decoded,
 *   (err) => Result.err(apiError),
 *   (val) => Result.ok(val)
 * );
 *
 * // ✅ Clean - toResult constructs the Result correctly
 * Decoder.toResult(decoded, (err) => apiError);
 *
 * Next time, try to annotate with `unknown`, see the tests.
 * ```
 */
const toResult = <A, E>(
  decoded: DecoderResult<A>,
  onError: (error: DecoderError) => E
): Result<E, A> => {
  return decoded.tag === 'DecoderError'
    ? Result.err(onError(decoded.error))
    : Result.ok(decoded.value);
};


export const Decoder = { match, toResult } as const;
