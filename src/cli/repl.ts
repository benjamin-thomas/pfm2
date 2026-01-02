#!/usr/bin/env node
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Interactive REPL for CLI commands
import * as readline from "node:readline";
import * as accountCommands from "./commands/account";
import {
	isValidRepoVariant,
	makeAccountRepoOrThrow,
	REPO_VARIANTS,
} from "./common";

const repoType = process.env.REPO;
if (!isValidRepoVariant(repoType)) {
	console.error(
		`Error: REPO environment variable is required. Use one of: ${REPO_VARIANTS.join(", ")}.`,
	);
	process.exit(1);
}

const accountRepo = (() => {
	try {
		return makeAccountRepoOrThrow(repoType);
	} catch (err) {
		console.error("Error initializing repository:", err);
		process.exit(1);
	}
})();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "pfm> ",
});

// Manage command history ourselves
const historyFile = path.join(os.homedir(), ".pfm_history");
const commandHistory: string[] = [];

// Load history from file
try {
	const savedHistory = fs
		.readFileSync(historyFile, "utf-8")
		.split("\n")
		.filter(Boolean);
	commandHistory.push(...savedHistory);
} catch (_err) {
	// No history file yet, that's ok
}

// Parse command line with support for quoted arguments
const parseCommandLine = (line: string): string[] => {
	const args: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"' || char === "'") {
			inQuotes = !inQuotes;
		} else if (char === " " && !inQuotes) {
			if (current) {
				args.push(current);
				current = "";
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

const processCommand = (line: string) => {
	const args = parseCommandLine(line.trim());
	const resource = args[0];
	const commandArgs = args.slice(1);

	if (!resource) {
		return;
	}

	switch (resource) {
		case "exit":
		case "quit":
			console.log("Goodbye!");
			rl.close();
			return;

		case "help":
			console.log("Usage: <resource> <command> [args]");
			console.log("Resources:");
			console.log("  account   - Manage accounts");
			console.log("  transaction - Manage transactions (TODO)");
			console.log("  balance   - View balances (TODO)");
			console.log("Commands:");
			console.log("  help  - Show this help");
			console.log("  exit  - Exit REPL");
			break;

		case "account":
			accountCommands.run(accountRepo, commandArgs);
			break;

		default:
			console.log(`Unknown resource: ${resource}. Type 'help' for usage.`);
	}
};

console.log("PFM Interactive REPL");
console.log(`Using REPO=${repoType}`);
console.log("Type 'help' for commands, 'exit' to quit\n");

rl.prompt();

rl.on("line", (line) => {
	if (line.trim()) {
		commandHistory.push(line);
	}
	try {
		processCommand(line);
	} catch (err) {
		console.error("Error:", err);
	}
	rl.prompt();
});

rl.on("close", () => {
	// Save history to file (keep last 100 commands)
	try {
		const history = commandHistory.slice(-100).join("\n");
		fs.writeFileSync(historyFile, history);
	} catch (err) {
		console.error("Error saving history:", err);
	}
	process.exit(0);
});
