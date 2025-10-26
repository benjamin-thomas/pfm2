import type { DecodeError } from "elm-decoders";
import { Result } from "./result";

type DecoderResult<T> =
	| { type: "OK"; value: T }
	| { type: "FAIL"; error: DecodeError };

/**
 * Pattern matching for decoder results
 * Similar to Maybe.match and Result.match
 */
const match = <A, B>(
	result: DecoderResult<A>,
	onError: (error: DecodeError) => B,
	onValid: (value: A) => B,
): B => {
	switch (result.type) {
		case "FAIL":
			return onError(result.error);
		case "OK":
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
 * DecoderUtil.match(decoded,
 *   (err) => Result.err(apiError),  // Result<ApiError, never>
 *   (val) => Result.ok(val)         // Result<never, Transaction[]>
 * );
 *
 * // ⚠️ Works but verbose - requires explicit type annotation
 * DecoderUtil.match<Transaction[], Result<ApiError, Transaction[]>>(decoded,
 *   (err) => Result.err(apiError),
 *   (val) => Result.ok(val)
 * );
 *
 * // ✅ Clean - toResult constructs the Result correctly
 * DecoderUtil.toResult(decoded, (err) => apiError);
 * ```
 */
const toResult = <A, E>(
	decoded: DecoderResult<A>,
	onError: (error: DecodeError) => E,
): Result<E, A> => {
	return decoded.type === "FAIL"
		? Result.err(onError(decoded.error))
		: Result.ok(decoded.value);
};

export const DecoderUtil = { match, toResult } as const;
