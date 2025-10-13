import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { assert, describe, it } from 'vitest';
import { FakeAccount, makeDbDate } from '../shared/fake-data';
import App from './App';
import { ApiFake } from './api-client/fake';

describe('App', () => {
  it('renders transactions from fake API', async () => {
    const employerAccount = FakeAccount.employer;
    const checkingAccount = FakeAccount.checking;
    const groceriesAccount = FakeAccount.groceries;

    const api = ApiFake.init([
      {
        fromAccountId: employerAccount.id,
        toAccountId: checkingAccount.id,
        date: makeDbDate('2024-01-15'),
        descr: 'Salary',
        cents: 200000,
      },
      {
        fromAccountId: checkingAccount.id,
        toAccountId: groceriesAccount.id,
        date: makeDbDate('2024-01-10'),
        descr: 'Supermarket',
        cents: 5000,
      },
    ]);

    render(
      <BrowserRouter>
        <App api={api} />
      </BrowserRouter>
    );

    // Should show loading state initially
    screen.getByText(/loading financial data/i);

    // Wait for and verify seed data appears
    await screen.findByText(/Salary/);
    await screen.findByText(/Supermarket/);

    // Should show transaction count
    const count = screen.getByText(/2 transactions/i);
    assert(count.textContent?.includes('2 transactions'));
  });
});
