import { assert, describe, it } from "vitest";
import { makeFakeIO } from "../../../shared/io/fake";
import { Maybe } from "../../../shared/utils/maybe";
import { Result } from "../../../shared/utils/result";
import { AccountRepoFake } from "../../repos/account/fake";
import { AccountCommand } from "./commands";

describe("Account Commands", () => {
	describe("create", () => {
		it("creates a new account", () => {
			const { io } = makeFakeIO({ now: 1000000 });
			const repo = AccountRepoFake.init(io, []);
			const accountCommand = AccountCommand.init(repo);
			const account = accountCommand.create({
				name: "New Account",
				categoryId: 2,
			});

			assert.deepEqual(account, {
				id: 1,
				name: "New Account",
				categoryId: 2,
				createdAt: 1000,
				updatedAt: 1000,
			});
		});
	});

	describe("update", () => {
		it("updates an existing account", () => {
			const { io, setTime } = makeFakeIO({ now: 1000000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: 2,
					name: "Savings",
					categoryId: 2,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);
			const accountCommand = AccountCommand.init(repo);

			setTime(2000000);
			const { affectedRows } = accountCommand.update(2, {
				name: "Updated Name",
				categoryId: 3,
			});

			assert.equal(affectedRows, 1);

			// Verify the update
			const maybeAccount = repo.findById(2);
			Maybe.match(
				maybeAccount,
				() => {
					throw new Error("Expected some value");
				},
				(account) => {
					assert.deepEqual(account, {
						id: 2,
						name: "Updated Name",
						categoryId: 3,
						createdAt: 1000,
						updatedAt: 2000,
					});
				},
			);
		});

		it("returns 0 affected rows when account not found", () => {
			const { io } = makeFakeIO({ now: 1000000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);
			const accountCommand = AccountCommand.init(repo);
			const { affectedRows } = accountCommand.update(999, {
				name: "Updated Name",
				categoryId: 3,
			});

			assert.equal(affectedRows, 0);
		});
	});

	describe("delete", () => {
		it("deletes an existing account", () => {
			const { io } = makeFakeIO({ now: 1000000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
				{
					id: 2,
					name: "Savings",
					categoryId: 2,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);
			const accountCommand = AccountCommand.init(repo);
			const result = accountCommand.delete(2);

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
			const maybeAccount = repo.findById(2);
			assert.equal(maybeAccount.tag, "Nothing");
		});

		it("returns 0 affected rows when account not found", () => {
			const { io } = makeFakeIO({ now: 1000000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);
			const accountCommand = AccountCommand.init(repo);
			const result = accountCommand.delete(999);

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

		it("returns error when account is locked", () => {
			const { io, setTime } = makeFakeIO({ now: 1000000 });
			const repo = AccountRepoFake.init(io, [
				{
					id: 1,
					name: "Checking",
					categoryId: 1,
					createdAt: 1000,
					updatedAt: 1000,
				},
			]);

			// Create a locked account
			setTime(2000000);
			const account = repo.create({
				name: "SYSTEM_Admin",
				categoryId: 2,
			});

			assert.deepEqual(account, {
				id: 2,
				name: "SYSTEM_Admin",
				categoryId: 2,
				createdAt: 2000,
				updatedAt: 2000,
			});

			const accountCommand = AccountCommand.init(repo);
			const result = accountCommand.delete(account.id);

			Result.match(
				result,
				(error) => {
					assert.deepStrictEqual(error, {
						tag: "AccountLocked",
						accountId: account.id,
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
