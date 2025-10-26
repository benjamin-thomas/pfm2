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
}: TransactionFiltersProps): React.JSX.Element => {
	return (
		<div className="transaction-search">
			<div className="transaction-search__row">
				<div className="transaction-search__field">
					<label>
						Description
						<input
							type="text"
							className="transaction-search__input"
							placeholder="Search by description"
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
						/>
					</label>
				</div>

				<div className="transaction-search__field">
					<label>
						Min Amount
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
						Max Amount
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
						Clear
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
						Unknown expenses
					</label>
				</div>
			</div>
		</div>
	);
};

export default TransactionFilters;
