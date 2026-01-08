import type { LedgerEntry } from "../../../shared/ledger";
import { useTranslation } from "../../i18n/context";

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
	const { t } = useTranslation();

	return (
		<div className="delete-confirmation">
			<p className="confirmation-question">{t.deleteQuestion}</p>
			<div className="transaction-recap">
				<div className="recap-row">
					<span className="recap-label">{t.description}:</span>
					<span className="recap-value" data-testid="delete-recap-description">
						{description}
					</span>
				</div>
				<div className="recap-row">
					<span className="recap-label">{t.amount}:</span>
					<span className="recap-value" data-testid="delete-recap-amount">
						{(parseFloat(amount) || 0).toFixed(2)}
					</span>
				</div>
			</div>
			<p className="confirmation-warning">{t.deleteWarning}</p>
			<div className="modal-actions">
				<div className="modal-actions__left" />
				<div className="modal-actions__right">
					<button
						type="button"
						className="button button--secondary"
						onClick={onCancel}
						data-testid="delete-cancel"
					>
						{t.cancel}
					</button>
					<button
						type="button"
						className="button button--danger"
						onClick={() => onConfirm(transaction.id)}
						data-testid="transaction-delete-confirm"
					>
						{t.confirmDelete}
					</button>
				</div>
			</div>
		</div>
	);
};
