// Account CLI commands
import type { AccountRepo } from '../../server/repos/account/interface';
import * as AccountQuery from '../../server/cqs/account/queries';
import * as AccountCommand from '../../server/cqs/account/commands';
import { Result } from '../../shared/utils/result';
import { Maybe } from '../../shared/utils/maybe';

export const run = async (repo: AccountRepo, args: string[]) => {
  const command = args[0];

  switch (command) {
    case 'list': {
      const accounts = await AccountQuery.list(repo);
      console.log('Accounts:');
      accounts.forEach(acc => {
        console.log(`  [${acc.accountId}] ${acc.name} (category: ${acc.categoryId})`);
      });
      break;
    }

    case 'find': {
      const idStr = args[1];
      if (!idStr) {
        console.error('Usage: pfm account find <id>');
        return;
      }

      const id = parseInt(idStr, 10);
      if (isNaN(id)) {
        console.error('Error: id must be a number');
        return;
      }

      const result = await AccountQuery.findById(repo, id);

      Result.match(
        result,
        (error) => {
          console.error(`Error: ${error.tag}`);
        },
        (maybeAccount) => {
          Maybe.match(
            maybeAccount,
            () => {
              console.log('Account not found');
            },
            (account) => {
              console.log(`Account [${account.accountId}]:`);
              console.log(`  Name: ${account.name}`);
              console.log(`  Category ID: ${account.categoryId}`);
            }
          );
        }
      );
      break;
    }

    case 'create': {
      const name = args[1];
      const categoryIdStr = args[2];

      if (!name || !categoryIdStr) {
        console.error('Usage: pfm account create <name> <categoryId>');
        return;
      }

      const categoryId = parseInt(categoryIdStr, 10);
      if (isNaN(categoryId)) {
        console.error('Error: categoryId must be a number');
        return;
      }

      const account = await AccountCommand.create(repo, { name, categoryId });
      console.log(`Created account [${account.accountId}]: ${account.name}`);
      break;
    }

    case 'update': {
      const idStr = args[1];
      const name = args[2];
      const categoryIdStr = args[3];

      if (!idStr || !name || !categoryIdStr) {
        console.error('Usage: pfm account update <id> <name> <categoryId>');
        return;
      }

      const id = parseInt(idStr, 10);
      const categoryId = parseInt(categoryIdStr, 10);
      if (isNaN(id) || isNaN(categoryId)) {
        console.error('Error: id and categoryId must be numbers');
        return;
      }

      const { affectedRows } = await AccountCommand.update(repo, id, { name, categoryId });
      if (affectedRows === 0) {
        console.log('Account not found');
      } else {
        console.log(`Updated account ${id}`);
      }
      break;
    }

    case 'remove': {
      const idStr = args[1];
      if (!idStr) {
        console.error('Usage: pfm account remove <id>');
        return;
      }

      const id = parseInt(idStr, 10);
      if (isNaN(id)) {
        console.error('Error: id must be a number');
        return;
      }

      const result = await AccountCommand.remove(repo, id);

      Result.match(
        result,
        (error) => {
          console.error(`Error: ${error.tag} - ${error.name}`);
        },
        (affectedRows) => {
          if (affectedRows.affectedRows === 0) {
            console.log('Account not found');
          } else {
            console.log(`Removed account ${id}`);
          }
        }
      );
      break;
    }

    default:
      console.log('Usage: pfm account <command> [args]');
      console.log('Commands:');
      console.log('  list                          - List all accounts');
      console.log('  find <id>                     - Find account by ID');
      console.log('  create <name> <categoryId>    - Create new account');
      console.log('  update <id> <name> <categoryId> - Update account');
      console.log('  remove <id>                   - Remove account');
      return;
  }
};
