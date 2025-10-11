#!/usr/bin/env node
// Interactive REPL for CLI commands
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as accountCommands from './commands/account';
import { makeAccountRepoOrThrow, isValidRepoVariant, REPO_VARIANTS } from './common';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'pfm> ',
});

// Load history from file
const historyFile = path.join(os.homedir(), '.pfm_history');
try {
  const history = fs.readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean);
  (rl as any).history = history;
} catch (err) {
  // No history file yet, that's ok
}

// Parse command line with support for quoted arguments
const parseCommandLine = (line: string): string[] => {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
};

const processCommand = async (line: string) => {
  const args = parseCommandLine(line.trim());
  const resource = args[0];
  const commandArgs = args.slice(1);

  if (!resource) {
    return;
  }

  switch (resource) {
    case 'exit':
    case 'quit':
      console.log('Goodbye!');
      rl.close();
      return;

    case 'help':
      console.log('Usage: <resource> <command> [args]');
      console.log('Resources:');
      console.log('  account   - Manage accounts');
      console.log('  transaction - Manage transactions (TODO)');
      console.log('  balance   - View balances (TODO)');
      console.log('Commands:');
      console.log('  help  - Show this help');
      console.log('  exit  - Exit REPL');
      break;

    case 'account':
      await accountCommands.run(accountRepo, commandArgs);
      break;

    default:
      console.log(`Unknown resource: ${resource}. Type 'help' for usage.`);
  }
};

console.log('PFM Interactive REPL');
console.log(`Using REPO=${repoType}`);
console.log("Type 'help' for commands, 'exit' to quit\n");

rl.prompt();

rl.on('line', async (line) => {
  try {
    await processCommand(line);
  } catch (err) {
    console.error('Error:', err);
  }
  rl.prompt();
});

rl.on('close', () => {
  // Save history to file
  try {
    const history = (rl as any).history.slice(0, 100).join('\n');
    fs.writeFileSync(historyFile, history);
  } catch (err) {
    console.error('Error saving history:', err);
  }
  process.exit(0);
});
