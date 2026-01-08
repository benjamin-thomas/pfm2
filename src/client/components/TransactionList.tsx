import type { LedgerEntry } from "../../shared/ledger";
import { useTranslation } from "../i18n/context";
import "./TransactionList.css";

type TransactionListProps = {
	transactions: LedgerEntry[];
	selectedAccountName: string;
	onTransactionSelect: (transaction: LedgerEntry) => void;
};

export const TransactionList = ({
	transactions,
	selectedAccountName,
	onTransactionSelect,
}: TransactionListProps) => {
	const { t, tAccount, tDescription, fMoney, fDate } = useTranslation();

	if (transactions.length === 0) {
		return (
			<div className="empty">{t.noTransactionsFound(selectedAccountName)}</div>
		);
	}

	return (
		<ul className="transaction-list__items">
			{transactions.map((entry) => {
				// Use flowCents to determine if money is coming in (+) or going out (-)
				const isPositive = entry.flowCents > 0;
				const amountClass = isPositive
					? "transaction-item__amount--positive"
					: "transaction-item__amount--negative";

				return (
					<li key={entry.id} className="transaction-item">
						{/* Wrap content in button for accessibility (keyboard navigation with Enter/Space) */}
						<button
							type="button"
							onClick={() => onTransactionSelect(entry)}
							className="transaction-item__button"
							data-testid={`transaction-item--${entry.id}`}
							data-test--descr={entry.descr}
							data-test--balance-before={entry.priorBalanceCents}
							data-test--balance-after={entry.runningBalanceCents}
						>
							{/* Desktop: single row layout, Mobile: stacked rows via CSS Grid */}
							<div className="transaction-item__grid">
								<div className="transaction-item__description">
									{tDescription(entry.descr)}
								</div>
								<div className="transaction-item__accounts">
									{tAccount(entry.fromAccountName)} →{" "}
									{tAccount(entry.toAccountName)}
								</div>
								<div className="transaction-item__date">
									{fDate(entry.date)}
								</div>
								<div
									className={`transaction-item__amount ${amountClass}`}
									data-test--amount={entry.cents}
								>
									{isPositive ? "+" : "-"}
									{fMoney(entry.cents)}
								</div>
								<div className="transaction-item__balance">
									<span className="balance-before">
										{fMoney(entry.priorBalanceCents)}
									</span>
									<span className="arrow-icon">→</span>
									<span
										className={`balance-after ${entry.runningBalanceCents < 0 ? "balance-after--negative" : ""}`}
									>
										{fMoney(entry.runningBalanceCents)}
									</span>
								</div>
							</div>
						</button>
					</li>
				);
			})}
		</ul>
	);
};
