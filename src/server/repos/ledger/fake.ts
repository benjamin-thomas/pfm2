import type { LedgerEntry } from "../../../shared/ledger";
import { compareLedgerEntry } from "../../../shared/ledger";
import type { AccountRepo } from "../account/interface";
import type { TransactionRepo } from "../transaction/interface";
import type { LedgerRepo } from "./interface";

// Fake implementation that calculates ledger entries from in-memory transactions
// Mimics the SQL logic: flow direction and running balance calculation

const init = (
	transactionRepo: TransactionRepo,
	accountRepo: AccountRepo,
): LedgerRepo => {
	return {
		getLedgerForAccount: (accountId: number): LedgerEntry[] => {
			const transactions = transactionRepo.listByAccount(accountId);
			const accounts = accountRepo.listAll();

			// Build account name lookup
			const accountNameMap = new Map(accounts.map((a) => [a.id, a.name]));

			// Convert transactions to ledger entries with flow direction
			const entries: LedgerEntry[] = transactions.map((tx) => {
				// flowCents: negative if money leaving this account, positive if entering
				const flowCents = tx.fromAccountId === accountId ? -tx.cents : tx.cents;

				return {
					...tx,
					fromAccountName: accountNameMap.get(tx.fromAccountId) || "Unknown",
					toAccountName: accountNameMap.get(tx.toAccountId) || "Unknown",
					flowCents,
					priorBalanceCents: 0, // Will be calculated below
					runningBalanceCents: 0, // Will be calculated below
				};
			});

			entries.sort(compareLedgerEntry);

			// Calculate running balance
			let runningBalance = 0;
			for (const entry of entries) {
				entry.priorBalanceCents = runningBalance;
				runningBalance += entry.flowCents;
				entry.runningBalanceCents = runningBalance;
			}

			return entries.reverse();
		},
	};
};

export const LedgerRepoFake = { init } as const;
