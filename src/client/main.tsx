import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { accountRows, categoryRows, getAccountByName, makeDbDate } from '../shared/fakeData';
import { AppWithRouter } from './AppWithRouter';
import { ApiFake } from './api-client/fake.ts';
import { ApiHttp } from './api-client/http.ts';
import './main.css';

// Choose API implementation based on URL param: ?api=fake
const params = new URLSearchParams(window.location.search);
const api = params.get('api') === 'fake'
  ? ApiFake.init({
    accounts: accountRows,
    categories: categoryRows,
    transactions: [
    {
      fromAccountId: getAccountByName('OpeningBalance').id,
      toAccountId: getAccountByName('Checking account').id,
      date: makeDbDate('2025-01-01'),
      descr: 'Opening Balance',
      cents: 150000,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Transport').id,
      date: makeDbDate('2025-01-02'),
      descr: 'Metro Monthly Pass',
      cents: 7500,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Groceries').id,
      date: makeDbDate('2025-01-05'),
      descr: 'Weekly Groceries - SuperMart',
      cents: 6247,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Groceries').id,
      date: makeDbDate('2025-01-08'),
      descr: 'Fresh Produce Market',
      cents: 3418,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Energy').id,
      date: makeDbDate('2025-01-10'),
      descr: 'Electricity Bill',
      cents: 8543,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Groceries').id,
      date: makeDbDate('2025-01-12'),
      descr: 'Weekly Groceries - SuperMart',
      cents: 5832,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Communications').id,
      date: makeDbDate('2025-01-15'),
      descr: 'Internet & Phone Bill',
      cents: 6500,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Transport').id,
      date: makeDbDate('2025-01-16'),
      descr: 'Gas Station Fill-up',
      cents: 4527,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Clothing').id,
      date: makeDbDate('2025-01-17'),
      descr: 'Electronics Store - Headphones',
      cents: 8949,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Groceries').id,
      date: makeDbDate('2025-01-19'),
      descr: 'Weekly Groceries - SuperMart',
      cents: 6891,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Health').id,
      date: makeDbDate('2025-01-20'),
      descr: 'Pharmacy - Prescriptions',
      cents: 3265,
    },
    {
      fromAccountId: getAccountByName('Clothing').id,
      toAccountId: getAccountByName('Checking account').id,
      date: makeDbDate('2025-01-22'),
      descr: 'Electronics Store - Headphones Refund',
      cents: 8949,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Unknown_EXPENSE').id,
      date: makeDbDate('2025-01-25'),
      descr: 'Monthly Rent',
      cents: 95000,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Groceries').id,
      date: makeDbDate('2025-01-26'),
      descr: 'Weekly Groceries - SuperMart',
      cents: 5523,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Clothing').id,
      date: makeDbDate('2025-01-28'),
      descr: 'Work Clothes',
      cents: 12345,
    },
    {
      fromAccountId: getAccountByName('Unknown_INCOME').id,
      toAccountId: getAccountByName('Checking account').id,
      date: makeDbDate('2025-01-29'),
      descr: 'Side hustle',
      cents: 35000,
    },
    {
      fromAccountId: getAccountByName('Employer ABC').id,
      toAccountId: getAccountByName('Checking account').id,
      date: makeDbDate('2025-01-31'),
      descr: 'Monthly Salary',
      cents: 250000,
    },
    {
      fromAccountId: getAccountByName('Checking account').id,
      toAccountId: getAccountByName('Leisure').id,
      date: makeDbDate('2025-01-31'),
      descr: 'Dinner & Movie',
      cents: 7582,
    },
  ],
  })
  : ApiHttp.init();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithRouter api={api} />
    </BrowserRouter>
  </React.StrictMode>
);
