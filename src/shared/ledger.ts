import type { Transaction } from "./transaction";

/**
 * A ledger entry represents a transaction from the perspective
 * of a selected account (the "viewing" account).
 *
 * It includes:
 * - The original transaction data
 * - Resolved account names (from account lookup)
 * - Flow direction (positive = money in, negative = money out)
 * - Running balance for the selected account
 */
export type LedgerEntry = Transaction & {
	fromAccountName: string;
	toAccountName: string;
	flowCents: number; // Negative = outflow from selected account, Positive = inflow to selected account
	priorBalanceCents: number;
	runningBalanceCents: number;
};
