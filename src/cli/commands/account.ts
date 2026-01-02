import { AccountCommand } from "../../server/cqs/account/commands";
import { AccountQuery } from "../../server/cqs/account/queries";
import type { AccountRepo } from "../../server/repos/account/interface";
import { Maybe } from "../../shared/utils/maybe";
import { Result } from "../../shared/utils/result";
import type { IO } from "../../shared/io/interface";

export const run = (io: IO, repo: AccountRepo, args: string[]) => {
	const accountQuery = AccountQuery.init(repo);
	const accountCommand = AccountCommand.init(repo);
	const command = args[0];

	switch (command) {
		case "list": {
			const accounts = accountQuery.list();
			io.logInfo("Accounts:");
			accounts.forEach((acc) => {
				io.logInfo(`  [${acc.id}] ${acc.name} (category: ${acc.categoryId})`);
			});
			break;
		}

		case "find": {
			const idStr = args[1];
			if (!idStr) {
				io.logErr("Usage: pfm account find <id>");
				return;
			}

			const id = parseInt(idStr, 10);
			if (Number.isNaN(id)) {
				io.logErr("Error: id must be a number");
				return;
			}

			const result = accountQuery.findById(id);

			Result.match(
				result,
				(error) => {
					io.logErr(`Error: ${error.tag}`);
				},
				(maybeAccount) => {
					Maybe.match(
						maybeAccount,
						() => {
							io.logInfo("Account not found");
						},
						(account) => {
							io.logInfo(`Account [${account.id}]:`);
							io.logInfo(`  Name: ${account.name}`);
							io.logInfo(`  Category ID: ${account.categoryId}`);
						},
					);
				},
			);
			break;
		}

		case "create": {
			const name = args[1];
			const categoryIdStr = args[2];

			if (!name || !categoryIdStr) {
				io.logErr("Usage: pfm account create <name> <categoryId>");
				return;
			}

			const categoryId = parseInt(categoryIdStr, 10);
			if (Number.isNaN(categoryId)) {
				io.logErr("Error: categoryId must be a number");
				return;
			}

			const account = accountCommand.create({ name, categoryId });
			io.logInfo(`Created account [${account.id}]: ${account.name}`);
			break;
		}

		case "update": {
			const idStr = args[1];
			const name = args[2];
			const categoryIdStr = args[3];

			if (!idStr || !name || !categoryIdStr) {
				io.logErr("Usage: pfm account update <id> <name> <categoryId>");
				return;
			}

			const id = parseInt(idStr, 10);
			const categoryId = parseInt(categoryIdStr, 10);
			if (Number.isNaN(id) || Number.isNaN(categoryId)) {
				io.logErr("Error: id and categoryId must be numbers");
				return;
			}

			const { affectedRows } = accountCommand.update(id, {
				name,
				categoryId,
			});
			if (affectedRows === 0) {
				io.logInfo("Account not found");
			} else {
				io.logInfo(`Updated account ${id}`);
			}
			break;
		}

		case "delete": {
			const idStr = args[1];
			if (!idStr) {
				io.logErr("Usage: pfm account delete <id>");
				return;
			}

			const id = parseInt(idStr, 10);
			if (Number.isNaN(id)) {
				io.logErr("Error: id must be a number");
				return;
			}

			const result = accountCommand.delete(id);

			Result.match(
				result,
				(error) => {
					io.logErr(`Error: ${error.tag} - ${error.name}`);
				},
				(affectedRows) => {
					if (affectedRows.affectedRows === 0) {
						io.logInfo("Account not found");
					} else {
						io.logInfo(`Removed account ${id}`);
					}
				},
			);
			break;
		}

		default:
			io.logInfo("Usage: pfm account <command> [args]");
			io.logInfo("Commands:");
			io.logInfo("  list                          - List all accounts");
			io.logInfo("  find <id>                     - Find account by ID");
			io.logInfo("  create <name> <categoryId>    - Create new account");
			io.logInfo("  update <id> <name> <categoryId> - Update account");
			io.logInfo("  delete <id>                   - Remove account");
			return;
	}
};
