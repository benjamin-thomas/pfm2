import type { LedgerEntry } from "../../../shared/ledger";

export interface LedgerRepo {
	getLedgerForAccount(accountId: number): LedgerEntry[];
}
