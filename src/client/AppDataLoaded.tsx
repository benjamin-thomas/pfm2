import { useEffect, useRef, useState } from "react";
import type { Account, AccountBalance } from "../shared/account";
import type { LedgerEntry } from "../shared/ledger";
import { isUnknownAccount } from "../shared/utils/accounts";
import { impossibleBranch } from "../shared/utils/impossibleBranch";
import { Maybe } from "../shared/utils/maybe";
import { Result } from "../shared/utils/result";
import type { Api, ApiError } from "./api-client/interface";
import { BalanceCards } from "./components/BalanceCards";
import TransactionFilters from "./components/TransactionFilters";
import { TransactionList } from "./components/TransactionList";
import {
	type DialogMode,
	type TransactionData,
	TransactionDialog,
} from "./components/Transaction/TransactionDialog";
import type { Transaction } from "../shared/transaction.ts";
import "./AppDataLoaded.css";

type AppDataLoadedProps = {
	api: Api;
	accounts: Account[];
	ledgerEntries: LedgerEntry[];
	balances: AccountBalance[];
	selectedAccountId: number;
	setSelectedAccountId: (id: number) => void;
	refetchAllData: () => void;
};

type SearchFilters = {
	description: string;
	minAmount: string;
	maxAmount: string;
	unknownExpenses: boolean;
};

const AppDataLoaded = ({
	api,
	accounts,
	ledgerEntries,
	balances,
	selectedAccountId,
	setSelectedAccountId,
	refetchAllData,
}: AppDataLoadedProps) => {
	const [isDarkMode, setIsDarkMode] = useState(() => {
		const saved = localStorage.getItem("theme");
		return saved ? saved === "dark" : true;
	});
	const [filters, setFilters] = useState<SearchFilters>({
		description: "",
		minAmount: "",
		maxAmount: "",
		unknownExpenses: false,
	});
	const [dialogMode, setDialogMode] = useState<Maybe<DialogMode>>(
		Maybe.nothing,
	);
	const [apiCallError, setApiCallError] = useState<Maybe<string>>(
		Maybe.nothing,
	);
	const lastFocusedElement = useRef<Maybe<HTMLElement>>(Maybe.nothing);

	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add("dark-theme");
		} else {
			document.documentElement.classList.remove("dark-theme");
		}
		localStorage.setItem("theme", isDarkMode ? "dark" : "light");
	}, [isDarkMode]);

	const toggleTheme = () => setIsDarkMode(!isDarkMode);

	const restoreFocusedRow: () => void = () => {
		// Restore on next tick to ensure we restore focus after dialog close
		setTimeout(() => {
			Maybe.match(
				lastFocusedElement.current,
				() => {},
				(element) => element.focus(),
			);
		}, 0);
	};

	const restoreFocusAfterDelete: () => void = () => {
		// After delete, the focused row no longer exists
		// Try to focus on a nearby row, or fallback to Add Transaction button
		setTimeout(() => {
			Maybe.match(
				lastFocusedElement.current,
				() => {
					// No element was focused, focus Add Transaction button
					const addButton = document.querySelector(
						'[data-testid="add-transaction-button"]',
					) as HTMLElement;
					addButton?.focus();
				},
				(deletedElement) => {
					// Check if element still exists in DOM
					if (document.contains(deletedElement)) {
						deletedElement.focus();
						return;
					}

					// Element was deleted, try to find next or previous sibling
					const transactionRows = Array.from(
						document.querySelectorAll('[data-testid^="transaction-item-"]'),
					) as HTMLElement[];

					if (transactionRows.length > 0) {
						// Focus on first available transaction
						transactionRows[0].focus();
					} else {
						// No transactions left, focus Add Transaction button
						const addButton = document.querySelector(
							'[data-testid="add-transaction-button"]',
						) as HTMLElement;
						addButton?.focus();
					}
				},
			);
		}, 0);
	};

	// Sanity check: must have valid selected account
	const selectedAccount = accounts.find(
		(a) => a.accountId === selectedAccountId,
	);
	if (!selectedAccount) {
		throw new Error(
			`Data integrity error: Selected account ${selectedAccountId} not found`,
		);
	}

	// Extract unknown accounts (validated at startup)
	const unknownExpense = accounts.find((acc) => acc.name === "Unknown_EXPENSE");
	const unknownIncome = accounts.find((acc) => acc.name === "Unknown_INCOME");

	if (!unknownExpense || !unknownIncome) {
		throw new Error("Data integrity error: Unknown accounts must exist");
	}

	// Filter ledger entries based on search criteria
	const filteredLedgerEntries = ledgerEntries.filter((entry) => {
		if (
			filters.description &&
			!entry.descr.toLowerCase().includes(filters.description.toLowerCase())
		) {
			return false;
		}

		if (filters.minAmount) {
			const minCents = Math.round(parseFloat(filters.minAmount) * 100);
			if (!Number.isNaN(minCents) && entry.cents < minCents) {
				return false;
			}
		}

		if (filters.maxAmount) {
			const maxCents = Math.round(parseFloat(filters.maxAmount) * 100);
			if (!Number.isNaN(maxCents) && entry.cents > maxCents) {
				return false;
			}
		}

		return !(filters.unknownExpenses && !isUnknownAccount(entry.toAccountName));
	});

	const handleClearFilters = () => {
		setFilters({
			description: "",
			minAmount: "",
			maxAmount: "",
			unknownExpenses: false,
		});
	};

	return (
		<>
			{/* Dark Mode Toggle */}
			<button
				type="button"
				className="theme-toggle"
				onClick={toggleTheme}
				title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
			>
				{isDarkMode ? "🌙" : "☀️"}
			</button>

			{Maybe.match(
				dialogMode,
				() => null,
				(mode) => {
					const clickedDeleteConfirmation = (transactionId: number) => {
						api.transactions.delete(transactionId).then((result) => {
							Result.match(
								result,
								(error) => {
									const errMsg =
										error.tag === "BadRequest"
											? error.reason
											: `Failed to delete: ${error.tag}`;
									setApiCallError(Maybe.just(errMsg));
								},
								() => {
									setDialogMode(Maybe.nothing);
									restoreFocusAfterDelete();
									refetchAllData();
								},
							);
						});
					};

					const clickedSave = (formData: TransactionData) => {
						// Determine which API call to make based on mode
						const save: () => Promise<Result<ApiError, Transaction>> = () => {
							switch (mode.kind) {
								case "add":
									return api.transactions.create(formData);
								case "edit":
									return api.transactions.update(
										mode.transaction.transactionId,
										formData,
									);
								default:
									return impossibleBranch(mode);
							}
						};

						save().then((result) => {
							Result.match(
								result,
								(error) => {
									const errMsg =
										error.tag === "BadRequest"
											? error.reason
											: `Failed to save: ${error.tag}`;
									setApiCallError(Maybe.just(errMsg));
								},
								() => {
									setDialogMode(Maybe.nothing);
									setApiCallError(Maybe.nothing);
									restoreFocusedRow();
									refetchAllData();
								},
							);
						});
					};

					return (
						<TransactionDialog
							clickedCancel={() => {
								setDialogMode(Maybe.nothing);
								setApiCallError(Maybe.nothing);
								restoreFocusedRow();
							}}
							clickedSave={clickedSave}
							clickedDeleteConfirmation={clickedDeleteConfirmation}
							apiCallError={apiCallError}
							formChanged={() => setApiCallError(Maybe.nothing)}
							accounts={accounts}
							mode={mode}
						/>
					);
				},
			)}

			<div className="section">
				<BalanceCards
					balances={balances}
					selectedAccountId={selectedAccountId}
					onSelectAccount={setSelectedAccountId}
				/>
			</div>

			<div className="section">
				<div className="transaction-list">
					<div className="transaction-list__header">
						<div className="transaction-list__header-title">
							<h3>Transactions</h3>
							<span className="transaction-count">
								{filteredLedgerEntries.length} of {ledgerEntries.length}{" "}
								transactions
							</span>
						</div>

						<div className="transaction-list__header-buttons">
							<button
								type="button"
								className="button button--primary"
								onClick={() =>
									setDialogMode(
										Maybe.just({
											kind: "add",
											defaultFromAccountId: selectedAccountId,
											defaultToAccountId: unknownExpense.accountId,
										}),
									)
								}
								data-testid="add-transaction-button"
							>
								Add Transaction
							</button>
						</div>
					</div>
					<TransactionFilters
						description={filters.description}
						minAmount={filters.minAmount}
						maxAmount={filters.maxAmount}
						unknownExpenses={filters.unknownExpenses}
						onDescriptionChange={(value) =>
							setFilters({ ...filters, description: value })
						}
						onMinAmountChange={(value) =>
							setFilters({ ...filters, minAmount: value })
						}
						onMaxAmountChange={(value) =>
							setFilters({ ...filters, maxAmount: value })
						}
						onUnknownExpensesChange={(value) =>
							setFilters({ ...filters, unknownExpenses: value })
						}
						onClear={handleClearFilters}
					/>
					<TransactionList
						transactions={filteredLedgerEntries}
						selectedAccountName={selectedAccount.name}
						onTransactionSelect={(transaction) => {
							// Store currently focused element to restore focus after modal closes
							const activeEl = document.activeElement;
							lastFocusedElement.current =
								activeEl instanceof HTMLElement
									? Maybe.just(activeEl)
									: Maybe.nothing;
							setDialogMode(Maybe.just({ kind: "edit", transaction }));
						}}
					/>
				</div>
			</div>
		</>
	);
};

export default AppDataLoaded;
