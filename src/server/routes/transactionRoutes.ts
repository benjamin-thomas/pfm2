import type { Router } from 'express';
import type { TransactionQuery } from '../cqs/transaction/queries';
import type { TransactionCommand } from '../cqs/transaction/commands';
import { z } from 'zod';
import { Maybe } from '../../shared/utils/maybe';

const newTransactionSchema = z.object({
  budgetId: z.number(),
  fromAccountId: z.number(),
  toAccountId: z.number(),
  uniqueFitId: z.string().nullable(),
  date: z.number(),
  descrOrig: z.string(),
  descr: z.string(),
  cents: z.number(),
});

type NewTransactionInput = z.infer<typeof newTransactionSchema>;

export const registerTransactionRoutes = (router: Router, transactionQuery: TransactionQuery, transactionCommand: TransactionCommand): void => {
  // GET /api/transactions?budgetId=1
  // http GET :8086/api/transactions budgetId==1
  router.get('/api/transactions', async (req, res) => {
    try {
      const budgetIdStr = req.query.budgetId;

      if (budgetIdStr) {
        const budgetId = parseInt(budgetIdStr as string, 10);
        if (isNaN(budgetId)) {
          res.status(400).json({ error: 'Invalid budgetId' });
          return;
        }
        const transactions = await transactionQuery.listByBudget(budgetId);
        res.json(transactions);
      } else {
        const result = await transactionQuery.list(Maybe.nothing, Maybe.nothing);
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // GET /api/transactions/:id
  router.get('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
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
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // POST /api/transactions
  router.post('/api/transactions', async (req, res) => {
    try {
      const result = newTransactionSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ error: 'Invalid transaction data', issues: result.error.issues });
        return;
      }

      const newTransaction: NewTransactionInput = result.data;

      const transaction = await transactionCommand.create(newTransaction);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // PUT /api/transactions/:id
  router.put('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid transaction ID' });
        return;
      }

      const result = newTransactionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: 'Invalid transaction data', issues: result.error.issues });
        return;
      }

      const { affectedRows } = await transactionCommand.update(id, result.data);
      if (affectedRows === 0) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // DELETE /api/transactions/:id
  router.delete('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
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
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};
