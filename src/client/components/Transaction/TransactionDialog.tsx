import { useEffect, useId, useRef, useState } from "react";
import type { Account } from "../../../shared/account";
import { dateToUnix, unixToDate } from "../../../shared/datetime";
import type { LedgerEntry } from "../../../shared/ledger";
import { impossibleBranch } from "../../../shared/utils/impossibleBranch";
import { Maybe } from "../../../shared/utils/maybe";
import { DeleteDialogBody } from "./DeleteDialogBody";
import "./TransactionDialog.css";

export type TransactionData = {
	fromAccountId: number;
	toAccountId: number;
	date: number;
	descr: string;
	cents: number;
};

export type DialogMode =
	| { kind: "add"; defaultFromAccountId: number; defaultToAccountId: number }
	| { kind: "edit"; transaction: LedgerEntry };

type TransactionDialogProps = {
	clickedCancel: () => void;
	clickedSave: (transaction: TransactionData) => void;
	clickedDeleteConfirmation: (transactionId: number) => void;
	apiCallError: Maybe<string>;
	formChanged: () => void;
	accounts: Account[];
	mode: DialogMode;
};

const toDateInputValue = (date: Date): string => {
	const offsetMinutes = date.getTimezoneOffset();
	const localTime = new Date(date.getTime() - offsetMinutes * 60_000);
	return localTime.toISOString().split("T")[0];
};

const parseLocalDate = (value: string): Date | null => {
	const [yearStr, monthStr, dayStr] = value.split("-");
	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);
	if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
		return null;
	}
	return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const TransactionDialog = ({
	clickedCancel,
	clickedSave,
	clickedDeleteConfirmation,
	apiCallError,
	formChanged,
	accounts,
	mode,
}: TransactionDialogProps) => {
	const descriptionId = useId();
	const fromAccountId = useId();
	const toAccountId = useId();
	const amountId = useId();
	const dateId = useId();

	const descriptionRef = useRef<HTMLInputElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	const {
		title,
		initialDescription,
		initialAmount,
		initialFromAccount,
		initialToAccount,
		initialDate,
	} = (() => {
		switch (mode.kind) {
			case "add":
				return {
					title: "Add Transaction",
					initialDescription: "",
					initialAmount: "",
					initialFromAccount: mode.defaultFromAccountId.toString(),
					initialToAccount: mode.defaultToAccountId.toString(),
					initialDate: toDateInputValue(new Date()),
				};
			case "edit":
				return {
					title: "Edit Transaction",
					initialDescription: mode.transaction.descr,
					initialAmount: (mode.transaction.cents / 100).toFixed(2),
					initialFromAccount: mode.transaction.fromAccountId.toString(),
					initialToAccount: mode.transaction.toAccountId.toString(),
					initialDate: toDateInputValue(unixToDate(mode.transaction.date)),
				};
			default:
				return impossibleBranch(mode);
		}
	})();

	const [description, setDescription] = useState(initialDescription);
	const [amount, setAmount] = useState(initialAmount);
	const [amountError, setAmountError] = useState<Maybe<string>>(Maybe.nothing);
	const [fromAccount, setFromAccount] = useState(initialFromAccount);
	const [toAccount, setToAccount] = useState(initialToAccount);
	const [date, setDate] = useState(initialDate);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	// Focus description field when modal opens
	useEffect(() => {
		descriptionRef.current?.focus();
	}, []);

	const makeAmountError = (amountValue: string): Maybe<string> => {
		if (!amountValue) return Maybe.nothing;

		const decimalPlaces = (amountValue.split(".")[1] || "").length;
		if (decimalPlaces > 2) {
			return Maybe.just("Amount can have at most 2 decimal places");
		}

		return Maybe.nothing;
	};

	const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setAmount(value);
		setAmountError(makeAmountError(value));
		formChanged();
	};

	// Handle Escape key globally
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				clickedCancel();
			}
		};

		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [clickedCancel]);

	// Focus trap: make Tab cycle within dialog
	useEffect(() => {
		const handleTab = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			if (!dialogRef.current) return;

			const focusableSelector =
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

			const focusableElements = Array.from(
				dialogRef.current.querySelectorAll(focusableSelector),
			) as HTMLElement[];

			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const currentElement = document.activeElement;

			// Check if current focus is within our dialog
			const currentIndex =
				currentElement instanceof HTMLElement
					? focusableElements.indexOf(currentElement)
					: -1;

			if (currentIndex === -1) {
				// Focus is outside dialog, bring it back to first element
				e.preventDefault();
				firstElement.focus();
				return;
			}

			if (e.shiftKey) {
				// Shift+Tab: move backwards
				if (currentIndex === 0) {
					e.preventDefault();
					lastElement.focus();
				}
			} else {
				// Tab: move forwards
				if (currentIndex === focusableElements.length - 1) {
					e.preventDefault();
					firstElement.focus();
				}
			}
		};

		document.addEventListener("keydown", handleTab);

		return () => {
			document.removeEventListener("keydown", handleTab);
		};
	}, []);

	const clickedSavePre = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const amountInCents = Math.round(parseFloat(amount) * 100);
		const parsedDate = parseLocalDate(date) ?? new Date();
		const dateTimestamp = dateToUnix(parsedDate);

		const transactionData = {
			fromAccountId: parseInt(fromAccount, 10),
			toAccountId: parseInt(toAccount, 10),
			date: dateTimestamp,
			descr: description,
			cents: amountInCents,
		};

		clickedSave(transactionData);
	};

	const handleClickedOutside = (e: React.MouseEvent<HTMLDivElement>) => {
		const clickedOutside = e.target === e.currentTarget;
		if (clickedOutside) clickedCancel();
	};

	const clickedDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const deleteConfirmationDialogBody = (() => {
		if (!showDeleteConfirmation) return null;

		switch (mode.kind) {
			case "add":
				return null;
			case "edit":
				return (
					<DeleteDialogBody
						transaction={mode.transaction}
						description={description}
						amount={amount}
						onCancel={() => setShowDeleteConfirmation(false)}
						onConfirm={clickedDeleteConfirmation}
					/>
				);
			default:
				return impossibleBranch(mode);
		}
	})();

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled via global Escape listener
		<div
			className="modal-overlay"
			onClick={handleClickedOutside}
			role="dialog"
			aria-modal="true"
		>
			<div className="modal-content" role="document" ref={dialogRef}>
				<div className="modal-header">
					<h2>{title}</h2>
				</div>

				{Maybe.match(
					apiCallError,
					() => null,
					(msg) => (
						<div className="form-error-banner">{msg}</div>
					),
				)}

				{deleteConfirmationDialogBody || (
					<form onSubmit={clickedSavePre}>
						<div className="form-field">
							<label htmlFor={descriptionId}>Description</label>
							<input
								ref={descriptionRef}
								id={descriptionId}
								type="text"
								value={description}
								onChange={(e) => {
									setDescription(e.target.value);
									formChanged();
								}}
								required
								data-testid="transaction-description"
							/>
						</div>

						<div className="form-field">
							<label htmlFor={fromAccountId}>From Account</label>
							<select
								id={fromAccountId}
								value={fromAccount}
								onChange={(e) => {
									setFromAccount(e.target.value);
									formChanged();
								}}
								data-testid="transaction-from-account"
							>
								{accounts
									.filter((acc) => acc.id.toString() !== toAccount)
									.map((acc) => (
										<option key={acc.id} value={acc.id}>
											{acc.name}
										</option>
									))}
							</select>
						</div>

						<div className="form-field">
							<label htmlFor={toAccountId}>To Account</label>
							<select
								id={toAccountId}
								value={toAccount}
								onChange={(e) => {
									setToAccount(e.target.value);
									formChanged();
								}}
								data-testid="transaction-to-account"
							>
								{accounts
									.filter((acc) => acc.id.toString() !== fromAccount)
									.map((acc) => (
										<option key={acc.id} value={acc.id}>
											{acc.name}
										</option>
									))}
							</select>
						</div>

						<div className="form-field">
							<label htmlFor={amountId}>Amount</label>
							<input
								id={amountId}
								type="number"
								step={0.01}
								value={amount}
								onChange={onAmountChange}
								required
								data-testid="transaction-amount"
							/>
							{Maybe.match(
								amountError,
								() => null,
								(msg) => (
									<div className="field-error">{msg}</div>
								),
							)}
						</div>

						<div className="form-field">
							<label htmlFor={dateId}>Date</label>
							<input
								id={dateId}
								type="date"
								value={date}
								onChange={(e) => {
									setDate(e.target.value);
									formChanged();
								}}
								required
								data-testid="transaction-date"
							/>
						</div>

						<div className="modal-actions">
							<div className="modal-actions__left">
								{(() => {
									switch (mode.kind) {
										case "add":
											return null;
										case "edit":
											return (
												<button
													type="button"
													className="button button--danger"
													onClick={clickedDelete}
													data-testid="transaction-delete"
												>
													Delete
												</button>
											);
										default:
											return impossibleBranch(mode);
									}
								})()}
							</div>
							<div className="modal-actions__right">
								<button
									type="button"
									className="button button--secondary"
									onClick={clickedCancel}
									data-testid="transaction-cancel"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="button button--primary"
									disabled={Maybe.isJust(amountError)}
									data-testid="transaction-save"
								>
									Save
								</button>
							</div>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
