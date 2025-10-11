import { render, screen } from '@testing-library/react';
import { describe, it, assert } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ApiFake } from './api-client/fake';

describe('App', () => {
  it('renders transactions from fake API', async () => {
    const api = ApiFake.init();

    render(
      <BrowserRouter>
        <App api={api} />
      </BrowserRouter>
    );

    // Should show loading state initially
    screen.getByText(/loading financial data/i);

    // Wait for and verify seed data appears
    await screen.findByText(/Monthly Income/);
    await screen.findByText(/rent payment/i);
    await screen.findByText(/grocery store/i);

    // Should show transaction count
    const count = screen.getByText(/4 transactions/i);
    assert(count.textContent?.includes('4 transactions'));
  });
});
