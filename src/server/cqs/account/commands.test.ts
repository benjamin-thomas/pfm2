import { assert, describe, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import { Result } from "../../../shared/utils/result";
import { AccountRepoFake } from "../../repos/account/fake";
import { AccountCommand } from "./commands";

describe("Account Commands", () => {
	describe("create", () => {
		it("creates a new account", async () => {
			const repo = AccountRepoFake.init();
			const accountCommand = AccountCommand.init(repo);
			const account = await accountCommand.create({
				name: "New Account",
				categoryId: 2,
			});

			assert.equal(account.name, "New Account");
			assert.equal(account.categoryId, 2);
			assert.property(account, "accountId");
		});
	});

	describe("update", () => {
		it("updates an existing account", async () => {
			const repo = AccountRepoFake.init();
			const accountCommand = AccountCommand.init(repo);
			const { affectedRows } = await accountCommand.update(2, {
				name: "Updated Name",
				categoryId: 3,
			});

			assert.equal(affectedRows, 1);

			// Verify the update
			const maybeAccount = await repo.findById(2);
			Maybe.match(
				maybeAccount,
				() => {
					throw new Error("Expected some value");
				},
				(account) => {
					assert.equal(account.name, "Updated Name");
					assert.equal(account.categoryId, 3);
				},
			);
		});

		it("returns 0 affected rows when account not found", async () => {
			const repo = AccountRepoFake.init();
			const accountCommand = AccountCommand.init(repo);
			const { affectedRows } = await accountCommand.update(999, {
				name: "Updated Name",
				categoryId: 3,
			});

			assert.equal(affectedRows, 0);
		});
	});

	describe("delete", () => {
		it("deletes an existing account", async () => {
			const repo = AccountRepoFake.init();
			const accountCommand = AccountCommand.init(repo);
			const result = await accountCommand.delete(2);

			Result.match(
				result,
				() => {
					throw new Error("Expected Ok");
				},
				(affectedRows) => {
					assert.equal(affectedRows.affectedRows, 1);
				},
			);

			// Verify it's gone
			const maybeAccount = await repo.findById(2);
			assert.equal(maybeAccount.tag, "Nothing");
		});

		it("returns 0 affected rows when account not found", async () => {
			const repo = AccountRepoFake.init();
			const accountCommand = AccountCommand.init(repo);
			const result = await accountCommand.delete(999);

			Result.match(
				result,
				() => {
					throw new Error("Expected Ok");
				},
				(affectedRows) => {
					assert.equal(affectedRows.affectedRows, 0);
				},
			);
		});

		it("returns error when account is locked", async () => {
			const repo = AccountRepoFake.init();
			// Create a locked account
			const account = await repo.create({
				name: "SYSTEM_Admin",
				categoryId: 2,
			});

			const accountCommand = AccountCommand.init(repo);
			const result = await accountCommand.delete(account.accountId);

			Result.match(
				result,
				(error) => {
					assert.deepStrictEqual(error, {
						tag: "AccountLocked",
						accountId: account.accountId,
						name: "SYSTEM_Admin",
					});
				},
				() => {
					throw new Error("Expected Err");
				},
			);
		});
	});
});
