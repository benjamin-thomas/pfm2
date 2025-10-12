#!/usr/bin/env node
// CLI entry point
import * as accountCommands from './commands/account';
import { isValidRepoVariant, makeAccountRepoOrThrow, REPO_VARIANTS } from './common';

const main = async () => {
  const repoType = process.env.REPO;
  if (!isValidRepoVariant(repoType)) {
    console.error(`Error: REPO environment variable is required. Use one of: ${REPO_VARIANTS.join(', ')}.`);
    process.exit(1);
  }

  const accountRepo = (() => {
    try {
      return makeAccountRepoOrThrow(repoType);
    } catch (err) {
      console.error('Error initializing repository:', err);
      process.exit(1);
    }
  })();

  const args = process.argv.slice(2);
  const resource = args[0];
  const commandArgs = args.slice(1);

  switch (resource) {
    case 'account':
      await accountCommands.run(accountRepo, commandArgs);
      break;

    default:
      console.log('Usage: pfm <resource> <command> [args]');
      console.log('Resources:');
      console.log('  account   - Manage accounts');
      console.log('  transaction - Manage transactions (TODO)');
      console.log('  balance   - View balances (TODO)');
      process.exit(1);
  }
};

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
