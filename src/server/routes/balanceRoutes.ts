import type { Router } from 'express';
import { z } from 'zod';
import type { BalanceRepo } from '../repos/balance/interface';
import { BalanceQuery } from '../cqs/balance/queries';

const balanceQuerySchema = z.object({
  budgetId: z.string().transform(val => parseInt(val, 10)),
});

export const registerBalanceRoutes = (router: Router, repo: BalanceRepo): void => {
  router.get('/api/balances', async (req, res) => {
    try {
      const result = balanceQuerySchema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ error: 'Invalid query params', issues: result.error.issues });
        return;
      }

      const balances = await BalanceQuery.getBalances(repo, result.data.budgetId);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};
