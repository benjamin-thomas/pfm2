import type { Api } from './interface';
import { ApiErr } from './interface';
import { Result } from '../../shared/utils/result';
import { Option } from '../../shared/utils/option';

// HTTP API that talks to the backend server

const init = (): Api => {
  return {
    transactions: {
      list: async ({ budgetId }) => {
        try {
          const res = await fetch(`/api/transactions?budgetId=${budgetId}`);
          if (res.status === 200) {
            const data = await res.json();
            return Result.ok(data);
          }
          if (res.status === 404)
            return Result.error(ApiErr.notFound);
          if (res.status >= 500)
            return Result.error(ApiErr.serverError);
          return Result.error(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.list):', error);
          return Result.error(ApiErr.serverError);
        }
      },

      findById: async (id: number) => {
        try {
          const res = await fetch(`/api/transactions/${id}`);
          if (res.status === 200) {
            const data = await res.json();
            return Result.ok(Option.some(data));
          }
          if (res.status === 404)
            return Result.ok(Option.none);
          if (res.status >= 500)
            return Result.error(ApiErr.serverError);
          return Result.error(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.findById):', error);
          return Result.error(ApiErr.serverError);
        }
      },

      create: async (transaction) => {
        try {
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
          });
          if (res.status === 201) {
            const data = await res.json();
            return Result.ok(data);
          }
          if (res.status === 400)
            return Result.error(ApiErr.badRequest('Invalid transaction data'));
          if (res.status >= 500)
            return Result.error(ApiErr.serverError);
          return Result.error(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.create):', error);
          return Result.error(ApiErr.serverError);
        }
      },

      update: async (id, transaction) => {
        try {
          const res = await fetch(`/api/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
          });
          if (res.status === 200) {
            const data = await res.json();
            return Result.ok(data);
          }
          if (res.status === 404)
            return Result.error(ApiErr.notFound);
          if (res.status === 400)
            return Result.error(ApiErr.badRequest('Invalid transaction data'));
          if (res.status >= 500)
            return Result.error(ApiErr.serverError);
          return Result.error(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.update):', error);
          return Result.error(ApiErr.serverError);
        }
      },

      delete: async (id) => {
        try {
          const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
          if (res.status === 204)
            return Result.ok(undefined);
          if (res.status === 404)
            return Result.error(ApiErr.notFound);
          if (res.status >= 500)
            return Result.error(ApiErr.serverError);
          return Result.error(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.delete):', error);
          return Result.error(ApiErr.serverError);
        }
      },
    },

    balances: {
      getBalances: async ({ budgetId }) => {
        try {
          const res = await fetch(`/api/balances?budgetId=${budgetId}`);
          if (res.status === 200) {
            const data = await res.json();
            return Result.ok(data);
          }
          if (res.status === 404)
            return Result.error(ApiErr.notFound);
          if (res.status >= 500)
            return Result.error(ApiErr.serverError);
          return Result.error(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (balances.getBalances):', error);
          return Result.error(ApiErr.serverError);
        }
      },
    },
  };
};

export const ApiHttp = { init };
