import type { LedgerEntry } from "../../../shared/ledger";

type DeleteDialogBodyProps = {
	transaction: LedgerEntry;
	description: string;
	amount: string;
	onCancel: () => void;
	onConfirm: (transactionId: number) => void;
};

export const DeleteDialogBody = ({
	transaction,
	description,
	amount,
	onCancel,
	onConfirm,
}: DeleteDialogBodyProps) => {
	return (
		<div className="delete-confirmation">
			<p className="confirmation-question">Delete this transaction?</p>
			<div className="transaction-recap">
				<div className="recap-row">
					<span className="recap-label">Description:</span>
					<span className="recap-value" data-testid="delete-recap-description">
						{description}
					</span>
				</div>
				<div className="recap-row">
					<span className="recap-label">Amount:</span>
					<span className="recap-value" data-testid="delete-recap-amount">
						{(parseFloat(amount) || 0).toFixed(2)}
					</span>
				</div>
			</div>
			<p className="confirmation-warning">This action cannot be undone.</p>
			<div className="modal-actions">
				<div className="modal-actions__left" />
				<div className="modal-actions__right">
					<button
						type="button"
						className="button button--secondary"
						onClick={onCancel}
						data-testid="delete-cancel"
					>
						Cancel
					</button>
					<button
						type="button"
						className="button button--danger"
						onClick={() => onConfirm(transaction.id)}
						data-testid="transaction-delete-confirm"
					>
						Confirm Delete
					</button>
				</div>
			</div>
		</div>
	);
};
