// Ledger query handlers - read operations only
import type { LedgerEntry } from "../../../shared/ledger";
import type { LedgerRepo } from "../../repos/ledger/interface";

export type LedgerQuery = {
	getLedgerForAccount(accountId: number): LedgerEntry[];
};

const init = (repo: LedgerRepo): LedgerQuery => {
	const getLedgerForAccount = (accountId: number): LedgerEntry[] => {
		return repo.getLedgerForAccount(accountId);
	};

	return {
		getLedgerForAccount,
	};
};

export const LedgerQuery = { init } as const;
