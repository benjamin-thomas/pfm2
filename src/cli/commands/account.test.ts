import { assert, describe, it } from "vitest";
import { AccountRepoFake } from "../../server/repos/account/fake";
import { makeFakeIO } from "../../shared/io/fake";
import { run } from "./account";

describe("CLI account commands", () => {
	describe("list", () => {
		it("displays all accounts", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: 2,
					name: "Savings",
					categoryId: 2,
					position: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["list"]);

			assert.deepEqual(logInfoLines, [
				["Accounts:"],
				["  [1] Checking (category: 1, position: 0)"],
				["  [2] Savings (category: 2, position: 1)"],
			]);
		});

		it("displays empty list when no accounts", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["list"]);

			assert.deepEqual(logInfoLines, [["Accounts:"]]);
		});
	});

	describe("find", () => {
		it("shows usage when missing id", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["find"]);

			assert.deepEqual(logErrLines, [["Usage: pfm account find <id>"]]);
		});

		it("shows error when id is NaN", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["find", "abc"]);

			assert.deepEqual(logErrLines, [["Error: id must be a number"]]);
		});

		it("shows 'not found' for non-existent account", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["find", "999"]);

			assert.deepEqual(logInfoLines, [["Account not found"]]);
		});

		it("displays account details when found", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: 2,
					name: "Savings",
					categoryId: 2,
					position: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["find", "2"]);

			assert.deepEqual(logInfoLines, [
				["Account [2]:"],
				["  Name: Savings"],
				["  Category ID: 2"],
				["  Position: 1"],
			]);
		});
	});

	describe("create", () => {
		it("shows usage when missing args", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["create"]);

			assert.deepEqual(logErrLines, [
				["Usage: pfm account create <name> <categoryId> <position>"],
			]);
		});

		it("shows usage when missing categoryId", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["create", "Test Account"]);

			assert.deepEqual(logErrLines, [
				["Usage: pfm account create <name> <categoryId> <position>"],
			]);
		});

		it("shows error when categoryId is NaN", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["create", "Test Account", "abc", "1"]);

			assert.deepEqual(logErrLines, [
				["Error: categoryId and position must be numbers"],
			]);
		});

		it("creates account successfully", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["create", "New Account", "2", "0"]);

			assert.deepEqual(logInfoLines, [["Created account [1]: New Account"]]);
		});

		it("creates account with correct next id", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Existing",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["create", "New Account", "2", "1"]);

			assert.deepEqual(logInfoLines, [["Created account [2]: New Account"]]);
		});
	});

	describe("update", () => {
		it("shows usage when missing args", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["update"]);

			assert.deepEqual(logErrLines, [
				["Usage: pfm account update <id> <name> <categoryId> <position>"],
			]);
		});

		it("shows usage when missing name and categoryId", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["update", "1"]);

			assert.deepEqual(logErrLines, [
				["Usage: pfm account update <id> <name> <categoryId> <position>"],
			]);
		});

		it("shows usage when missing categoryId", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["update", "1", "New Name"]);

			assert.deepEqual(logErrLines, [
				["Usage: pfm account update <id> <name> <categoryId> <position>"],
			]);
		});

		it("shows error when id is NaN", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["update", "abc", "New Name", "2", "0"]);

			assert.deepEqual(logErrLines, [
				["Error: id, categoryId, and position must be numbers"],
			]);
		});

		it("shows error when categoryId is NaN", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["update", "1", "New Name", "abc", "0"]);

			assert.deepEqual(logErrLines, [
				["Error: id, categoryId, and position must be numbers"],
			]);
		});

		it("shows 'not found' when account does not exist", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["update", "999", "New Name", "2", "1"]);

			assert.deepEqual(logInfoLines, [["Account not found"]]);
		});

		it("updates account successfully", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["update", "1", "Updated Name", "3", "1"]);

			assert.deepEqual(logInfoLines, [["Updated account 1"]]);
		});
	});

	describe("delete", () => {
		it("shows usage when missing id", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["delete"]);

			assert.deepEqual(logErrLines, [["Usage: pfm account delete <id>"]]);
		});

		it("shows error when id is NaN", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["delete", "abc"]);

			assert.deepEqual(logErrLines, [["Error: id must be a number"]]);
		});

		it("shows 'not found' when account does not exist", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["delete", "999"]);

			assert.deepEqual(logInfoLines, [["Account not found"]]);
		});

		it("shows error when account is locked", () => {
			const { io, logErrLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);
			// Create a locked account (name starts with SYSTEM_)
			repo.create({ name: "SYSTEM_Admin", categoryId: 1, position: 1 });

			run(io, repo, ["delete", "2"]);

			assert.deepEqual(logErrLines, [["Error: AccountLocked - SYSTEM_Admin"]]);
		});

		it("deletes account successfully", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					position: 0,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: 2,
					name: "Savings",
					categoryId: 2,
					position: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			run(io, repo, ["delete", "2"]);

			assert.deepEqual(logInfoLines, [["Removed account 2"]]);
		});
	});

	describe("default (unknown command)", () => {
		it("shows usage/help for unknown command", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, ["unknown"]);

			assert.deepEqual(logInfoLines, [
				["Usage: pfm account <command> [args]"],
				["Commands:"],
				["  list                          - List all accounts"],
				["  find <id>                     - Find account by ID"],
				["  create <name> <categoryId> <position>    - Create new account"],
				["  update <id> <name> <categoryId> <position> - Update account"],
				["  delete <id>                   - Remove account"],
			]);
		});

		it("shows usage/help when no command provided", () => {
			const { io, logInfoLines } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, []);

			run(io, repo, []);

			assert.deepEqual(logInfoLines, [
				["Usage: pfm account <command> [args]"],
				["Commands:"],
				["  list                          - List all accounts"],
				["  find <id>                     - Find account by ID"],
				["  create <name> <categoryId> <position>    - Create new account"],
				["  update <id> <name> <categoryId> <position> - Update account"],
				["  delete <id>                   - Remove account"],
			]);
		});
	});
});
