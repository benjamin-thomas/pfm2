import { format } from 'tiny-decoders';
import { transactionCodec, transactionsCodec } from '../../shared/transaction';
import { Decoder } from '../../shared/utils/decoder';
import { Maybe } from '../../shared/utils/maybe';
import { Result } from '../../shared/utils/result';
import type { Api } from './interface';
import { ApiErr } from './interface';

// HTTP API that talks to the backend server

const init = (): Api => {
  return {
    transactions: {
      list: async ({ searchTerm }) => {
        try {
          const res = await fetch(`/api/transactions?search=${searchTerm}`);
          if (res.status === 200) {
            const data = await res.json();
            const decoded = transactionsCodec.decoder(data);
            return Decoder.toResult(decoded, (error) => {
              console.error('Decode error (transactions.list):', format(error));
              return ApiErr.badRequest('Invalid response format');
            });
          }
          if (res.status === 404)
            return Result.err(ApiErr.notFound);
          if (res.status >= 500)
            return Result.err(ApiErr.serverError);
          return Result.err(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.list):', error);
          return Result.err(ApiErr.serverError);
        }
      },

      findById: async (id: number) => {
        try {
          const res = await fetch(`/api/transactions/${id}`);
          if (res.status === 200) {
            const data = await res.json();
            const decoded = transactionCodec.decoder(data);
            return Result.map(
              Decoder.toResult(decoded, (error) => {
                console.error('Decode error (transactions.findById):', format(error));
                return ApiErr.badRequest('Invalid response format');
              }),
              (transaction) => Maybe.just(transaction)
            );
          }
          if (res.status === 404)
            return Result.ok(Maybe.nothing);
          if (res.status >= 500)
            return Result.err(ApiErr.serverError);
          return Result.err(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.findById):', error);
          return Result.err(ApiErr.serverError);
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
            const decoded = transactionCodec.decoder(data);
            return Decoder.toResult(decoded, (error) => {
              console.error('Decode error (transactions.create):', format(error));
              return ApiErr.badRequest('Invalid response format');
            });
          }
          if (res.status === 400)
            return Result.err(ApiErr.badRequest('Invalid transaction data'));
          if (res.status >= 500)
            return Result.err(ApiErr.serverError);
          return Result.err(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.create):', error);
          return Result.err(ApiErr.serverError);
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
            const decoded = transactionCodec.decoder(data);
            return Decoder.toResult(decoded, (error) => {
              console.error('Decode error (transactions.update):', format(error));
              return ApiErr.badRequest('Invalid response format');
            });
          }
          if (res.status === 404)
            return Result.err(ApiErr.notFound);
          if (res.status === 400)
            return Result.err(ApiErr.badRequest('Invalid transaction data'));
          if (res.status >= 500)
            return Result.err(ApiErr.serverError);
          return Result.err(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.update):', error);
          return Result.err(ApiErr.serverError);
        }
      },

      delete: async (id) => {
        try {
          const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
          if (res.status === 204)
            return Result.ok(undefined);
          if (res.status === 404)
            return Result.err(ApiErr.notFound);
          if (res.status >= 500)
            return Result.err(ApiErr.serverError);
          return Result.err(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (transactions.delete):', error);
          return Result.err(ApiErr.serverError);
        }
      },
    },

    balances: {
      getBalances: async () => {
        try {
          const res = await fetch('/api/balances');
          if (res.status === 200) {
            const data = await res.json();
            return Result.ok(data);
          }
          if (res.status === 404)
            return Result.err(ApiErr.notFound);
          if (res.status >= 500)
            return Result.err(ApiErr.serverError);
          return Result.err(ApiErr.badRequest('Bad request'));
        } catch (error) {
          console.error('API error (balances.getBalances):', error);
          return Result.err(ApiErr.serverError);
        }
      },
    },
  };
};

export const ApiHttp = { init };
