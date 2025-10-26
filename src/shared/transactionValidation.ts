import type { ApiError } from "../client/api-client/interface";
import { Result } from "./utils/result";

/**
 * Validates that a transaction doesn't transfer from/to the same account.
 *
 * Uses callback pattern to avoid awkward if-checks in calling code.
 *
 * @example
 * ```ts
 * return validateTransaction(
 *   tx.fromAccountId,
 *   tx.toAccountId,
 *   () => {
 *     // Create/update transaction logic here
 *     return Result.ok(newTransaction);
 *   }
 * );
 * ```
 */
export const validateTransaction = <T>(
	fromAccountId: number,
	toAccountId: number,
	onValid: () => Result<ApiError, T>,
): Result<ApiError, T> => {
	if (fromAccountId === toAccountId) {
		return Result.err({
			tag: "BadRequest" as const,
			reason: "Cannot transfer to the same account",
		});
	}
	return onValid();
};
