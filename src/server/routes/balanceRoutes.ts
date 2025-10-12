import type { Router } from 'express';
import { z } from 'zod';
import type { BalanceQuery } from '../cqs/balance/queries';

const balanceQuerySchema = z.object({
  budgetId: z.string().transform(val => parseInt(val, 10)),
});

export const registerBalanceRoutes = (router: Router, balanceQuery: BalanceQuery): void => {
  router.get('/api/balances', async (req, res) => {
    try {
      const result = balanceQuerySchema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ error: 'Invalid query params', issues: result.error.issues });
        return;
      }

      const balances = await balanceQuery.getBalances(result.data.budgetId);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};
