import './TransactionFilters.css';

const TransactionFilters = (): React.JSX.Element => {
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
            />
          </label>
        </div>

        <div className="transaction-search__field">
          <label>
            Min Amount
            <input
              type="number"
              className="transaction-search__input"
              defaultValue="40.00"
            />
          </label>
        </div>

        <div className="transaction-search__field">
          <label>
            Max Amount
            <input
              type="number"
              className="transaction-search__input"
              defaultValue="100.00"
            />
          </label>
        </div>

        <div className="transaction-search__field--button">
          <button type="button" className="search-clear-button">
            Clear
          </button>
        </div>
      </div>

      <div className="transaction-search__row transaction-search__row--bottom">
        <div className="transaction-search__field">
          <label>
            <input type="checkbox" defaultChecked />
            {' '}Unknown expenses
          </label>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;