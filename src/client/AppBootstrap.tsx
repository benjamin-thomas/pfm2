import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Account } from "../shared/account";
import type { Status } from "../shared/async";
import { impossibleBranch } from "../shared/utils/impossibleBranch";
import { Result } from "../shared/utils/result";
import AppDataLoader from "./AppDataLoader";
import type { Api } from "./api-client/interface";
import { useTranslation } from "./i18n/context";

type AppBootstrapProps = {
	api: Api;
};

export const AppBootstrap = ({ api }: AppBootstrapProps) => {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const [accountsStatus, setAccountsStatus] = useState<
		Status<{ accounts: Account[] }>
	>({
		kind: "Loading",
	});

	useEffect(() => {
		api.accounts
			.list()
			.then((result) => {
				Result.match(
					result,
					(error) => {
						const errMsg =
							error.tag === "BadRequest"
								? error.reason
								: "Failed to load accounts";
						setAccountsStatus({ kind: "Error", error: errMsg });
					},
					(accounts) => {
						// Set default account if none selected (read inside callback to avoid stale closure)
						setSearchParams((params) => {
							if (!params.get("account") && accounts.length > 0) {
								params.set("account", String(accounts[0].id));
							}
							return params;
						});

						setAccountsStatus({ kind: "Loaded", accounts });
					},
				);
			})
			.catch((err) =>
				setAccountsStatus({
					kind: "Error",
					error: err?.message || "Unknown error",
				}),
			);
	}, [api, setSearchParams]);

	const accountParam = searchParams.get("account");
	const selectedAccountId = accountParam ? parseInt(accountParam, 10) : 0;

	const setSelectedAccountId = useCallback(
		(accountId: number) => {
			setSearchParams((params) => {
				params.set("account", accountId.toString());
				return params;
			});
		},
		[setSearchParams],
	);

	switch (accountsStatus.kind) {
		case "Loading":
			return <div>{t.loadingAccounts}</div>;
		case "Error":
			return (
				<div>
					{t.errorLoadingAccounts} {accountsStatus.error}
				</div>
			);
		case "Loaded":
			return (
				<AppDataLoader
					api={api}
					initialAccounts={accountsStatus.accounts}
					selectedAccountId={selectedAccountId}
					setSelectedAccountId={setSelectedAccountId}
				/>
			);
		default:
			return impossibleBranch(accountsStatus);
	}
};
