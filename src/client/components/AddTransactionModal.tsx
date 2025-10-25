import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Account } from '../../shared/account';
import { dateToUnix } from '../../shared/datetime';
import './AddTransactionModal.css';

type AddTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: NewTransactionData) => void;
  accounts: Account[];
  defaultFromAccountId: number;
  defaultToAccountId: number;
};

export type NewTransactionData = {
  fromAccountId: number;
  toAccountId: number;
  date: number;
  descr: string;
  cents: number;
};

const toDateInputValue = (date: Date): string => {
  const offsetMinutes = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - offsetMinutes * 60_000);
  return localTime.toISOString().split('T')[0];
};

const parseLocalDate = (value: string): Date | null => {
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const AddTransactionModal = ({ isOpen, onClose, onSubmit, accounts, defaultFromAccountId, defaultToAccountId }: AddTransactionModalProps) => {
  const descriptionId = useId();
  const fromAccountId = useId();
  const toAccountId = useId();
  const amountId = useId();
  const dateId = useId();

  const descriptionRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [fromAccount, setFromAccount] = useState(defaultFromAccountId.toString());
  const [toAccount, setToAccount] = useState(defaultToAccountId.toString());
  const [date, setDate] = useState(() => toDateInputValue(new Date()));

  // Focus description field when modal opens
  useEffect(() => {
    if (isOpen && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isOpen]);

  const makeAmountError = (amountValue: string): string => {
    if (!amountValue) return '';

    const decimalPlaces = (amountValue.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return 'Amount can have at most 2 decimal places';
    }

    return '';
  };

  const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setAmountError(makeAmountError(value));
  };

  // useCallback gives a "stable ref" to the following useEffect dependency (prevents useless re-renders)
  const handleClose = useCallback(() => {
    setDescription('');
    setAmount('');
    setAmountError('');
    setFromAccount(defaultFromAccountId.toString());
    setToAccount(defaultToAccountId.toString());
    setDate(toDateInputValue(new Date()));
    onClose();
  }, [onClose, defaultFromAccountId, defaultToAccountId]);

  // Handle Escape key globally
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

    onSubmit(transactionData);

    // Reset form
    setDescription('');
    setAmount('');
    setAmountError('');
    setFromAccount(defaultFromAccountId.toString());
    setToAccount(defaultToAccountId.toString());
    setDate(toDateInputValue(new Date()));
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled via global Escape listener
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content" role="document">
        <div className="modal-header">
          <h2>Add Transaction</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor={descriptionId}>Description</label>
            <input
              ref={descriptionRef}
              id={descriptionId}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              data-testid="transaction-description"
            />
          </div>

          <div className="form-field">
            <label htmlFor={fromAccountId}>From Account</label>
            <select
              id={fromAccountId}
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              data-testid="transaction-from-account"
            >
              {accounts
                .filter((acc) => acc.accountId.toString() !== toAccount)
                .map((acc) => (
                  <option key={acc.accountId} value={acc.accountId}>
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
              onChange={(e) => setToAccount(e.target.value)}
              data-testid="transaction-to-account"
            >
              {accounts
                .filter((acc) => acc.accountId.toString() !== fromAccount)
                .map((acc) => (
                  <option key={acc.accountId} value={acc.accountId}>
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
            <div className="field-error">{amountError}</div>
          </div>

          <div className="form-field">
            <label htmlFor={dateId}>Date</label>
            <input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              data-testid="transaction-date"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="button button--secondary" onClick={handleClose} data-testid="transaction-cancel">
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={!!amountError} data-testid="transaction-save">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
