import React from 'react';
import ReactDOM from 'react-dom/client';
import { FakeAccount, makeDbDate } from '../shared/fake-data';
import App from './App';
import { ApiFake } from './api-client/fake.ts';
import { ApiHttp } from './api-client/http.ts';
import './main.css';

// Choose API implementation based on URL param: ?api=fake
const params = new URLSearchParams(window.location.search);
const api = params.get('api') === 'fake'
  ? ApiFake.init([
    {
      fromAccountId: FakeAccount.employer.id,
      toAccountId: FakeAccount.checking.id,
      date: makeDbDate('2024-09-30'),
      descr: 'Income',
      cents: 100000,
    },
    {
      fromAccountId: FakeAccount.checking.id,
      toAccountId: FakeAccount.unknownExpense.id,
      date: makeDbDate('2024-09-25'),
      descr: 'Rent',
      cents: 50000,
    },
    {
      fromAccountId: FakeAccount.checking.id,
      toAccountId: FakeAccount.groceries.id,
      date: makeDbDate('2024-09-20'),
      descr: 'Grocery Store',
      cents: 3400,
    },
    {
      fromAccountId: FakeAccount.checking.id,
      toAccountId: FakeAccount.transport.id,
      date: makeDbDate('2024-09-18'),
      descr: 'Gas Station',
      cents: 2500,
    },
  ])
  : ApiHttp.init();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App api={api} />
  </React.StrictMode>
);