import type { AccountBalance } from "../../../shared/account";

export interface BalanceRepo {
	getBalances(): Promise<AccountBalance[]>;
}
