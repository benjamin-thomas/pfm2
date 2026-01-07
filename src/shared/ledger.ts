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

/**
 * Compare function for sorting ledger entries by date ASC, then id ASC.
 *
 * Provides stable ordering for transactions/ledger entries:
 * - Primary sort by date (chronological order, oldest first)
 * - Secondary sort by id (ensures deterministic order for same-day items)
 *
 * The id tiebreaker is critical for same-day transactions where the
 * order of operations matters (e.g., opening balance must come before
 * expenses on the same day for correct running balance calculation).
 *
 * Used by:
 * - Ledger repos (fake and SQL) for balance calculation
 * - BalanceChart for displaying data points in chronological order
 * - Frontend fake API for ledger entry generation
 */
export const compareLedgerEntry = (
	a: { date: number; id: number },
	b: { date: number; id: number },
): number => {
	const dateDiff = a.date - b.date;
	return dateDiff !== 0 ? dateDiff : a.id - b.id;
};
