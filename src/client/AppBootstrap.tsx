import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Account } from "../shared/account";
import type { Status } from "../shared/async";
import { impossibleBranch } from "../shared/utils/impossibleBranch";
import { Result } from "../shared/utils/result";
import AppDataLoader from "./AppDataLoader";
import type { Api } from "./api-client/interface";

type AppBootstrapProps = {
	api: Api;
};

export const AppBootstrap = ({ api }: AppBootstrapProps) => {
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
						const accountParam = searchParams.get("account");
						if (!accountParam && accounts.length > 0) {
							setSearchParams((params) => {
								params.set("account", String(accounts[0].accountId));
								return params;
							});
						}

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
	}, [api, searchParams, setSearchParams]);

	const accountParam = searchParams.get("account");
	const selectedAccountId = accountParam ? parseInt(accountParam, 10) : 0;

	const setSelectedAccountId = (accountId: number) => {
		setSearchParams((params) => {
			params.set("account", accountId.toString());
			return params;
		});
	};

	switch (accountsStatus.kind) {
		case "Loading":
			return <div>Loading accounts...</div>;
		case "Error":
			return <div>Error loading accounts: {accountsStatus.error}</div>;
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
