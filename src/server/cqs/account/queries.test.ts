import { assert, describe, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import { Result } from "../../../shared/utils/result";
import { AccountRepoFake } from "../../repos/account/fake";
import { AccountQuery } from "./queries";

describe("Account Queries", () => {
	describe("list", () => {
		it("returns all accounts", async () => {
			const repo = AccountRepoFake.init();
			const accountQuery = AccountQuery.init(repo);
			const accounts = await accountQuery.list();

			assert.isAbove(accounts.length, 0);
			assert.property(accounts[0], "accountId");
			assert.property(accounts[0], "name");
			assert.property(accounts[0], "categoryId");
		});
	});

	describe("findById", () => {
		it("returns account when found", async () => {
			const repo = AccountRepoFake.init();
			const accountQuery = AccountQuery.init(repo);
			const result = await accountQuery.findById(2);

			Result.match(
				result,
				() => {
					throw new Error("Expected Ok");
				},
				(maybeAccount) => {
					Maybe.match(
						maybeAccount,
						() => {
							throw new Error("Expected some value");
						},
						(account) => {
							assert.equal(account.accountId, 2);
							assert.equal(account.name, "Checking account");
						},
					);
				},
			);
		});

		it("returns none when account not found", async () => {
			const repo = AccountRepoFake.init();
			const accountQuery = AccountQuery.init(repo);
			const result = await accountQuery.findById(999);

			Result.match(
				result,
				() => {
					throw new Error("Expected Ok");
				},
				(optAccount) => {
					assert.equal(optAccount.tag, "Nothing");
				},
			);
		});

		it("returns error when account is hidden", async () => {
			const repo = AccountRepoFake.init();
			// Create a hidden account
			const account = await repo.create({
				name: "HIDDEN_Secret",
				categoryId: 2,
			});

			const accountQuery = AccountQuery.init(repo);
			const result = await accountQuery.findById(account.accountId);

			Result.match(
				result,
				(error) => {
					assert.deepEqual(error, {
						tag: "AccountHidden",
						accountId: account.accountId,
					});
				},
				() => {
					throw new Error("Expected Err");
				},
			);
		});
	});
});
