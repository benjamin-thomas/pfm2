import { describe, it, assert } from 'vitest';
import { AccountRepoFake } from '../../repos/account/fake';
import * as AccountCommand from './commands';
import { Result } from '../../../shared/utils/result';
import { Option } from '../../../shared/utils/option';

describe('Account Commands', () => {
  describe('create', () => {
    it('creates a new account', async () => {
      const repo = AccountRepoFake.init();
      const account = await AccountCommand.create(repo, {
        name: 'New Account',
        categoryId: 2,
      });

      assert.equal(account.name, 'New Account');
      assert.equal(account.categoryId, 2);
      assert.property(account, 'accountId');
    });
  });

  describe('update', () => {
    it('updates an existing account', async () => {
      const repo = AccountRepoFake.init();
      const { affectedRows } = await AccountCommand.update(repo, 2, {
        name: 'Updated Name',
        categoryId: 3,
      });

      assert.equal(affectedRows, 1);

      // Verify the update
      const result = await repo.findById(2);
      Option.match(
        result,
        () => { throw new Error('Expected some value'); },
        (account) => {
          assert.equal(account.name, 'Updated Name');
          assert.equal(account.categoryId, 3);
        }
      );
    });

    it('returns 0 affected rows when account not found', async () => {
      const repo = AccountRepoFake.init();
      const { affectedRows } = await AccountCommand.update(repo, 999, {
        name: 'Updated Name',
        categoryId: 3,
      });

      assert.equal(affectedRows, 0);
    });
  });

  describe('remove', () => {
    it('removes an existing account', async () => {
      const repo = AccountRepoFake.init();
      const result = await AccountCommand.remove(repo, 2);

      Result.match(
        result,
        () => { throw new Error('Expected Ok'); },
        (affectedRows) => {
          assert.equal(affectedRows.affectedRows, 1);
        }
      );

      // Verify it's gone
      const accountOpt = await repo.findById(2);
      assert.equal(accountOpt.tag, 'none');
    });

    it('returns 0 affected rows when account not found', async () => {
      const repo = AccountRepoFake.init();
      const result = await AccountCommand.remove(repo, 999);

      Result.match(
        result,
        () => { throw new Error('Expected Ok'); },
        (affectedRows) => {
          assert.equal(affectedRows.affectedRows, 0);
        }
      );
    });

    it('returns error when account is locked', async () => {
      const repo = AccountRepoFake.init();
      // Create a locked account
      const account = await repo.create({ name: 'SYSTEM_Admin', categoryId: 2 });

      const result = await AccountCommand.remove(repo, account.accountId);

      Result.match(
        result,
        (error) => {
          assert.deepStrictEqual(error, {
            tag: 'AccountLocked',
            accountId: account.accountId,
            name: 'SYSTEM_Admin',
          });
        },
        () => { throw new Error('Expected Err'); }
      );
    });
  });
});
