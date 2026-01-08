import { useEffect, useRef, useState } from "react";
import type { Account, AccountBalance } from "../shared/account";
import type { LedgerEntry } from "../shared/ledger";
import { isUnknownAccount } from "../shared/utils/accounts";
import { impossibleBranch } from "../shared/utils/impossibleBranch";
import { Maybe } from "../shared/utils/maybe";
import { Result } from "../shared/utils/result";
import type { Api, ApiError } from "./api-client/interface";
import { BalanceCards } from "./components/BalanceCards";
import { BalanceChart } from "./components/BalanceChart";
import {
	type DialogMode,
	type TransactionData,
	TransactionDialog,
} from "./components/Transaction/TransactionDialog";
import TransactionFilters from "./components/TransactionFilters";
import { TransactionList } from "./components/TransactionList";
import { useTranslation } from "./i18n/context";
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
	const { locale, setLocale, t, tAccount } = useTranslation();
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
	const [isResetting, setIsResetting] = useState(false);
	const [isSpinning, setIsSpinning] = useState(false);
	const resetButtonRef = useRef<HTMLButtonElement>(null);
	const shouldStopSpinningRef = useRef(false);
	const lastFocusedElement = useRef<Maybe<HTMLElement>>(Maybe.nothing);

	// Handle the spinning animation lifecycle
	useEffect(() => {
		if (isResetting) {
			setIsSpinning(true);
			shouldStopSpinningRef.current = false;
		} else {
			shouldStopSpinningRef.current = true;
		}
	}, [isResetting]);

	// Stop spinning cleanly at the end of the rotation cycle
	useEffect(() => {
		if (!isSpinning) return;

		const button = resetButtonRef.current;
		if (!button) {
			// Should never happen
			console.warn("Reset button ref is null while spinning");
			return;
		}

		const handleIteration = () => {
			if (shouldStopSpinningRef.current) setIsSpinning(false);
		};

		button.addEventListener("animationiteration", handleIteration);
		return () =>
			button.removeEventListener("animationiteration", handleIteration);
	}, [isSpinning]);

	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add("dark-theme");
		} else {
			document.documentElement.classList.remove("dark-theme");
		}
		localStorage.setItem("theme", isDarkMode ? "dark" : "light");
	}, [isDarkMode]);

	const toggleTheme = () => setIsDarkMode(!isDarkMode);

	const handleResetData = async () => {
		setIsResetting(true);
		try {
			const result = await api.admin.resetData();
			Result.match(
				result,
				(error) => {
					console.error("Failed to reset data:", error);
					setApiCallError(Maybe.just(t.failedToResetData));
				},
				() => {
					refetchAllData();
				},
			);
		} finally {
			setIsResetting(false);
		}
	};

	const restoreFocusedRow: () => void = () => {
		// Restore on the next tick to ensure we restore focus after dialog close
		setTimeout(() => {
			Maybe.match(
				lastFocusedElement.current,
				() => {},
				(element) => element.focus(),
			);
		}, 0);
	};

	const restoreFocusAfterDelete: () => void = () => {
		// After delete, the focused row no longer exists.
		// Try to focus on a nearby row or fallback to the "Add Transaction" button
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
					// Check if the element still exists in DOM
					if (document.contains(deletedElement)) {
						deletedElement.focus();
						return;
					}

					// Element was deleted, try to find the next or previous sibling
					const transactionRows = Array.from(
						document.querySelectorAll('[data-testid^="transaction-item-"]'),
					) as HTMLElement[];

					if (transactionRows.length > 0) {
						// Focus on the first available transaction
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

	// Sanity check: must have a valid selected account
	const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
	if (!selectedAccount) {
		throw new Error(
			`Data integrity error: Selected account ${selectedAccountId} not found`,
		);
	}

	// Extract unknown accounts (validated at startup)
	const unknownExpenseAccount = accounts.find(
		(acc) => acc.name === "Unknown_EXPENSE",
	);
	const unknownIncomeAccount = accounts.find(
		(acc) => acc.name === "Unknown_INCOME",
	);

	if (!unknownExpenseAccount || !unknownIncomeAccount) {
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

	const handleChartPointClick = (transactionId: number) => {
		const row = document.querySelector(
			`[data-testid="transaction-item--${transactionId}"]`,
		);
		if (!row) {
			alert(t.transactionNotVisible);
			return;
		}

		// Scroll to the row
		row.scrollIntoView({ behavior: "smooth", block: "center" });

		// Add highlight class and remove after animation
		row.classList.add("transaction-item--highlighted");
		setTimeout(() => {
			row.classList.remove("transaction-item--highlighted");
		}, 1500);
	};
	return (
		<>
			{/* Header buttons */}
			<div className="header-buttons">
				{/* Language flags - separated from other buttons */}
				<div className="locale-buttons">
					<button
						type="button"
						className={`locale-flag${locale === "fr" ? " locale-flag--active" : ""}`}
						onClick={() => setLocale("fr")}
						title={t.switchToFrench}
						data-testid="locale-fr-button"
						aria-label={t.switchToFrench}
					>
						🇫🇷
					</button>
					<button
						type="button"
						className={`locale-flag${locale === "en" ? " locale-flag--active" : ""}`}
						onClick={() => setLocale("en")}
						title={t.switchToEnglish}
						data-testid="locale-en-button"
						aria-label={t.switchToEnglish}
					>
						🇺🇸
					</button>
				</div>

				<button
					ref={resetButtonRef}
					type="button"
					className={`header-button${isSpinning ? " header-button--spinning" : ""}`}
					onClick={handleResetData}
					disabled={isResetting}
					title={t.resetToDemo}
					data-testid="reset-data-button"
				>
					↻
				</button>

				<button
					type="button"
					className="theme-toggle"
					onClick={toggleTheme}
					title={isDarkMode ? t.switchToLightMode : t.switchToDarkMode}
				>
					{isDarkMode ? "🌙" : "☀️"}
				</button>
			</div>

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
											: `${t.failedToDelete} ${error.tag}`;
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
						const save: () => Promise<Result<ApiError, null>> = () => {
							switch (mode.kind) {
								case "add":
									return api.transactions.create(formData);
								case "edit":
									return api.transactions.update(mode.transaction.id, formData);
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
											: `${t.failedToSave} ${error.tag}`;
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
				<BalanceChart
					ledgerEntries={ledgerEntries}
					accountName={selectedAccount.name}
					onPointClick={handleChartPointClick}
				/>
			</div>

			<div className="section">
				<div className="transaction-list">
					<div className="transaction-list__header">
						<div className="transaction-list__header-title">
							<h3>{t.transactions}</h3>
							<span className="transaction-count">
								{t.transactionCount(
									filteredLedgerEntries.length,
									ledgerEntries.length,
								)}
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
											defaultToAccountId: unknownExpenseAccount.id,
										}),
									)
								}
								data-testid="add-transaction-button"
							>
								{t.addTransaction}
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
						onAddTransaction={() =>
							setDialogMode(
								Maybe.just({
									kind: "add",
									defaultFromAccountId: selectedAccountId,
									defaultToAccountId: unknownExpenseAccount.id,
								}),
							)
						}
					/>
					<TransactionList
						transactions={filteredLedgerEntries}
						selectedAccountName={tAccount(selectedAccount.name)}
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
