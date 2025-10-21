import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { dateToUnix } from '../../shared/datetime';
import './AddTransactionModal.css';

type AddTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: NewTransactionData) => void;
};

export type NewTransactionData = {
  fromAccountId: number;
  toAccountId: number;
  date: number;
  descr: string;
  cents: number;
};

// Account options for the dropdowns
const ACCOUNT_OPTIONS = [
  { id: 2, name: 'Checking account' },
  { id: 3, name: 'Savings account' },
  { id: 5, name: 'Employer' },
  { id: 6, name: 'Unknown_EXPENSE' },
  { id: 7, name: 'Groceries' },
  { id: 8, name: 'Communications' },
  { id: 9, name: 'Transport' },
  { id: 10, name: 'Health' },
  { id: 11, name: 'Energy' },
  { id: 12, name: 'Clothing' },
  { id: 13, name: 'Leisure' },
];

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

export const AddTransactionModal = ({ isOpen, onClose, onSubmit }: AddTransactionModalProps) => {
  const descriptionId = useId();
  const fromAccountId = useId();
  const toAccountId = useId();
  const amountId = useId();
  const dateId = useId();

  const descriptionRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('2');
  const [toAccount, setToAccount] = useState('7');
  const [date, setDate] = useState(() => toDateInputValue(new Date()));

  // Focus description field when modal opens
  useEffect(() => {
    if (isOpen && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isOpen]);

  // useCallback gives a "stable ref" to the following useEffect dependency (prevents useless re-renders)
  const handleClose = useCallback(() => {
    console.log('Handling close...');
    setDescription('');
    setAmount('');
    setFromAccount('2');
    setToAccount('7');
    setDate(toDateInputValue(new Date()));
    onClose();
  }, [onClose]);

  // Handle Escape key globally
  useEffect(() => {
    if (!isOpen) return;
    console.log("✅✅ Defining global escape listener...");

    const handleEscape = (e: KeyboardEvent) => {
      console.log("A key was pressed", e.key);
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    console.log('✅ Global Escape listener added');
    document.addEventListener('keydown', handleEscape);

    return () => {
      console.log('❌ Global Escape listener removed');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const parsedDate = parseLocalDate(date) ?? new Date();
    const dateTimestamp = dateToUnix(parsedDate);

    onSubmit({
      fromAccountId: parseInt(fromAccount, 10),
      toAccountId: parseInt(toAccount, 10),
      date: dateTimestamp,
      descr: description,
      cents: amountInCents,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setFromAccount('2');
    setToAccount('7');
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
            />
          </div>

          <div className="form-field">
            <label htmlFor={fromAccountId}>From Account</label>
            <select
              id={fromAccountId}
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
            >
              {ACCOUNT_OPTIONS.map((acc) => (
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
              onChange={(e) => setToAccount(e.target.value)}
            >
              {ACCOUNT_OPTIONS.map((acc) => (
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
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor={dateId}>Date</label>
            <input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="button button--secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
