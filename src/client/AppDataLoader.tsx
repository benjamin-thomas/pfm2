import { useCallback, useEffect, useState } from "react";
import type { Account, AccountBalance } from "../shared/account";
import type { Status } from "../shared/async";
import type { LedgerEntry } from "../shared/ledger";
import { impossibleBranch } from "../shared/utils/impossibleBranch";
import { Result } from "../shared/utils/result";
import AppDataLoaded from "./AppDataLoaded";
import type { Api } from "./api-client/interface";
import { useTranslation } from "./i18n/context";
import "./components/Buttons.css";

type FinancialData = {
	ledgerEntries: LedgerEntry[];
	balances: AccountBalance[];
	accounts: Account[];
};

type AppDataLoaderProps = {
	api: Api;
	initialAccounts: Account[];
	selectedAccountId: number;
	setSelectedAccountId: (accountId: number) => void;
};

const AppDataLoader = ({
	api,
	initialAccounts,
	selectedAccountId,
	setSelectedAccountId,
}: AppDataLoaderProps) => {
	const { t } = useTranslation();
	const [financialData, setFinancialData] = useState<Status<FinancialData>>({
		kind: "Loading",
	});
	const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

	const fetchFinancialData = useCallback(
		(accountId: number, accounts: Account[]) => {
			Promise.all([
				api.ledger.getLedgerForAccount(accountId),
				api.balances.getBalances(),
			])
				.then(([ledgerResult, balResult]) => {
					Result.match(
						ledgerResult,
						(error) => {
							const errMsg =
								error.tag === "BadRequest"
									? error.reason
									: t.failedToLoadLedger;
							setFinancialData({ kind: "Error", error: errMsg });
						},
						(ledgerEntries) => {
							Result.match(
								balResult,
								(error) => {
									const errMsg =
										error.tag === "BadRequest"
											? error.reason
											: t.failedToLoadBalances;
									setFinancialData({ kind: "Error", error: errMsg });
								},
								(balances) => {
									setFinancialData({
										kind: "Loaded",
										ledgerEntries,
										balances,
										accounts,
									});
								},
							);
						},
					);
				})
				.catch((err) =>
					setFinancialData({
						kind: "Error",
						error: err?.message || "Unknown error",
					}),
				);
		},
		[api.ledger, api.balances, t.failedToLoadLedger, t.failedToLoadBalances],
	);

	useEffect(() => {
		fetchFinancialData(selectedAccountId, accounts);
	}, [fetchFinancialData, selectedAccountId, accounts]);

	const refetchAllData = useCallback(() => {
		api.accounts
			.list()
			.then((accountsResult) => {
				Result.match(
					accountsResult,
					(error) => {
						const errMsg =
							error.tag === "BadRequest"
								? error.reason
								: "Failed to load accounts";
						setFinancialData({ kind: "Error", error: errMsg });
					},
					(freshAccounts) => {
						setAccounts(freshAccounts);
						fetchFinancialData(selectedAccountId, freshAccounts);
					},
				);
			})
			.catch((err) =>
				setFinancialData({
					kind: "Error",
					error: err?.message || "Unknown error",
				}),
			);
	}, [api.accounts, fetchFinancialData, selectedAccountId]);

	return (
		<div className="container">
			<h1>{t.appTitle}</h1>

			{(() => {
				switch (financialData.kind) {
					case "Loading": {
						return (
							<div className="section">
								<div>{t.loadingFinancialData}</div>
							</div>
						);
					}

					case "Error": {
						return (
							<div className="section">
								<div>
									{t.errorLoadingFinancialData} {financialData.error}
								</div>
							</div>
						);
					}

					case "Loaded": {
						const { balances, ledgerEntries, accounts } = financialData;

						return (
							<AppDataLoaded
								api={api}
								accounts={accounts}
								ledgerEntries={ledgerEntries}
								balances={balances}
								selectedAccountId={selectedAccountId}
								setSelectedAccountId={setSelectedAccountId}
								refetchAllData={refetchAllData}
							/>
						);
					}

					/* v8 ignore next 2 */
					default:
						return impossibleBranch(financialData);
				}
			})()}
		</div>
	);
};

export default AppDataLoader;
