import type { Router } from 'express';
import type { AccountQuery } from '../cqs/account/queries';
import type { AccountCommand } from '../cqs/account/commands';
import { z } from 'zod';
import { Result } from '../../shared/utils/result';
import { Maybe } from '../../shared/utils/maybe';
import { impossibleBranch } from '../../shared/utils/impossibleBranch';

const newAccountSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number(),
});

type NewAccountInput = z.infer<typeof newAccountSchema>;

export const registerAccountRoutes = (router: Router, accountQuery: AccountQuery, accountCommand: AccountCommand): void => {
  // GET /api/accounts
  router.get('/api/accounts', async (_req, res) => {
    try {
      const accounts = await accountQuery.list();
      res.json(accounts);
    } catch (error) {
      console.error('Error in GET /api/accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/accounts/:id
  router.get('/api/accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      const result = await accountQuery.findById(id);

      Result.match(
        result,
        (error) => {
          switch (error.tag) {
            case 'AccountHidden':
              res.status(403).json({ error: 'Account is hidden' });
              break;
            /* v8 ignore next 2 */
            default:
              impossibleBranch(error.tag);
          }
        },
        (maybeAccount) => {
          Maybe.match(
            maybeAccount,
            () => {
              res.status(404).json({ error: 'Account not found' });
            },
            (account) => {
              res.json(account);
            }
          );
        }
      );
    } catch (error) {
      console.error('Error in GET /api/accounts/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/accounts
  router.post('/api/accounts', async (req, res) => {
    try {
      const parseResult = newAccountSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid account data', issues: parseResult.error.issues });
        return;
      }

      const newAccount: NewAccountInput = parseResult.data;
      const account = await accountCommand.create(newAccount);
      res.status(201).json(account);
    } catch (error) {
      console.error('Error in POST /api/accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/accounts/:id
  router.put('/api/accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      const parseResult = newAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid account data', issues: parseResult.error.issues });
        return;
      }

      const updates: NewAccountInput = parseResult.data;
      const { affectedRows } = await accountCommand.update(id, updates);

      if (affectedRows === 0) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error in PUT /api/accounts/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/accounts/:id
  router.delete('/api/accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid account ID' });
        return;
      }

      const result = await accountCommand.delete(id);

      Result.match(
        result,
        (error) => {
          switch (error.tag) {
            case 'AccountLocked':
              res.status(403).json({ error: `Cannot delete locked account: ${error.name}` });
              break;
            /* v8 ignore next 2 */
            default:
              impossibleBranch(error.tag);
          }
        },
        (affectedRows) => {
          if (affectedRows.affectedRows === 0) {
            res.status(404).json({ error: 'Account not found' });
          } else {
            res.status(204).send();
          }
        }
      );
    } catch (error) {
      console.error('Error in DELETE /api/accounts/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
