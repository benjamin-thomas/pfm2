import type { Router } from 'express';
import type { TransactionRepo } from '../repos/transaction/interface';
import { z } from 'zod';

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

export const registerTransactionRoutes = (router: Router, repo: TransactionRepo): void => {
  // GET /api/transactions?budgetId=1
  // http GET :8086/api/transactions budgetId==1
  router.get('/api/transactions', async (req, res) => {
    try {
      const budgetId = req.query.budgetId ? parseInt(req.query.budgetId as string, 10) : undefined;

      if (budgetId) {
        const transactions = await repo.listByBudget(budgetId);
        res.json(transactions);
      } else {
        const result = await repo.list();
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
      const transaction = await repo.findByIdOrNull(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json(transaction);
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

      const transaction = await repo.create(result.data);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // PUT /api/transactions/:id
  router.put('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = newTransactionSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ error: 'Invalid transaction data', issues: result.error.issues });
        return;
      }

      const transaction = await repo.updateOrThrow(id, result.data);
      res.json(transaction);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  // DELETE /api/transactions/:id
  router.delete('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await repo.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};
