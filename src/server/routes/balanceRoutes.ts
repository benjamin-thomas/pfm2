import type { Router } from 'express';
import type { BalanceQuery } from '../cqs/balance/queries';

export const registerBalanceRoutes = (router: Router, balanceQuery: BalanceQuery): void => {
  router.get('/api/balances', async (_req, res) => {
    try {
      const balances = await balanceQuery.getBalances();
      res.json(balances);
    } catch (error) {
      console.error('Error in GET /api/balances:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
