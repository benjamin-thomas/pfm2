import type { Router } from 'express';
import { fields, format, map, string } from 'tiny-decoders';
import { Decoder } from '../../shared/utils/decoder';
import type { BalanceQuery } from '../cqs/balance/queries';


const balanceQueryCodec = map(fields({
  budgetId: string,
}), {
  decoder: (value: { budgetId: string }) => ({
    budgetId: parseInt(value.budgetId, 10),
  }),
  encoder: (value: { budgetId: number }) => ({
    budgetId: String(value.budgetId),
  }),
});

export const registerBalanceRoutes = (router: Router, balanceQuery: BalanceQuery): void => {
  router.get('/api/balances', async (req, res) => {
    try {
      const result = balanceQueryCodec.decoder(req.query);

      await Decoder.match(
        result,
        (error) => {
          res.status(400).json({ error: 'Invalid query params', details: format(error) });
          return Promise.resolve();
        },
        async (query) => {
          const balances = await balanceQuery.getBalances(query.budgetId);
          res.json(balances);
        }
      );
    } catch (error) {
      console.error('Error in GET /api/balances:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
