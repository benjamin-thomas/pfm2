import { useTranslation } from "../i18n/context";
import "./TransactionFilters.css";

type TransactionFiltersProps = {
	description: string;
	minAmount: string;
	maxAmount: string;
	unknownExpenses: boolean;
	onDescriptionChange: (value: string) => void;
	onMinAmountChange: (value: string) => void;
	onMaxAmountChange: (value: string) => void;
	onUnknownExpensesChange: (value: boolean) => void;
	onClear: () => void;
	onAddTransaction: () => void;
};

const TransactionFilters = ({
	description,
	minAmount,
	maxAmount,
	unknownExpenses,
	onDescriptionChange,
	onMinAmountChange,
	onMaxAmountChange,
	onUnknownExpensesChange,
	onClear,
	onAddTransaction,
}: TransactionFiltersProps): React.JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className="transaction-search">
			<div className="transaction-search__row">
				<div className="transaction-search__field">
					<label>
						{t.description}
						<input
							type="text"
							className="transaction-search__input"
							placeholder={t.searchByDescription}
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
						/>
					</label>
				</div>

				<div className="transaction-search__field">
					<label>
						{t.minAmount}
						<input
							type="number"
							className="transaction-search__input"
							value={minAmount}
							onChange={(e) => onMinAmountChange(e.target.value)}
						/>
					</label>
				</div>

				<div className="transaction-search__field">
					<label>
						{t.maxAmount}
						<input
							type="number"
							className="transaction-search__input"
							value={maxAmount}
							onChange={(e) => onMaxAmountChange(e.target.value)}
						/>
					</label>
				</div>

				<div className="transaction-search__field--button">
					<button
						type="button"
						className="search-clear-button"
						onClick={onClear}
					>
						{t.clear}
					</button>
				</div>
			</div>

			<div className="transaction-search__row transaction-search__row--bottom">
				<div className="transaction-search__field">
					<label>
						<input
							type="checkbox"
							checked={unknownExpenses}
							onChange={(e) => onUnknownExpensesChange(e.target.checked)}
						/>{" "}
						{t.unknownExpenses}
					</label>
				</div>
			</div>

			{/* Mobile-only Add Transaction button */}
			<div className="transaction-search__mobile-action">
				<button
					type="button"
					className="button button--primary"
					onClick={onAddTransaction}
				>
					{t.addTransaction}
				</button>
			</div>
		</div>
	);
};

export default TransactionFilters;
