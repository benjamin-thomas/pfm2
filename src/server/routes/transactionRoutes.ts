import { Decoder } from 'elm-decoders';
import type { Router } from 'express';
import type { Transaction } from '../../shared/transaction';
import { DecoderUtil } from '../../shared/utils/decoder';
import { Maybe } from '../../shared/utils/maybe';
import type { TransactionCommand } from '../cqs/transaction/commands';
import type { TransactionQuery } from '../cqs/transaction/queries';

const newTransactionDecoder = Decoder.object({
  fromAccountId: Decoder.number,
  toAccountId: Decoder.number,
  date: Decoder.number,
  descr: Decoder.string,
  cents: Decoder.number,
});

type NewTransactionInput = {
  fromAccountId: number;
  toAccountId: number;
  date: number;
  descr: string;
  cents: number;
};

export const registerTransactionRoutes = (router: Router, transactionQuery: TransactionQuery, transactionCommand: TransactionCommand): void => {
  // GET /api/transactions?search=term
  // http GET :8086/api/transactions search==grocery
  router.get('/api/transactions', async (_req, res) => {
    try {
      const result: Transaction[] = await transactionQuery.list(Maybe.nothing);
      res.json(result);
    } catch (error) {
      console.error('Error in GET /api/transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/transactions/:id
  router.get('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const maybeTransaction = await transactionQuery.findById(id);

      Maybe.match(
        maybeTransaction,
        () => {
          res.status(404).json({ error: 'Transaction not found' });
        },
        (transaction) => {
          res.json(transaction);
        }
      );
    } catch (error) {
      console.error('Error in GET /api/transactions/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/transactions
  router.post('/api/transactions', async (req, res) => {
    try {
      const result = newTransactionDecoder.run(req.body);

      await DecoderUtil.match(
        result,
        (error) => {
          res.status(400).json({ error: 'Invalid transaction data', details: error });
          return Promise.resolve();
        },
        async (newTransaction: NewTransactionInput) => {
          const transaction = await transactionCommand.create(newTransaction);
          res.status(201).json(transaction);
        }
      );
    } catch (error) {
      console.error('Error in POST /api/transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/transactions/:id
  router.put('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const result = newTransactionDecoder.run(req.body);

      await DecoderUtil.match(
        result,
        (error) => {
          res.status(400).json({ error: 'Invalid transaction data', details: error });
          return Promise.resolve();
        },
        async (updates) => {
          const { affectedRows } = await transactionCommand.update(id, updates);
          if (affectedRows === 0) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
          }

          res.status(204).send();
        }
      );
    } catch (error) {
      console.error('Error in PUT /api/transactions/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/transactions/:id
  router.delete('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const { affectedRows } = await transactionCommand.delete(id);
      if (affectedRows === 0) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error in DELETE /api/transactions/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
