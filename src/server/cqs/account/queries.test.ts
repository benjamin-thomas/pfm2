import { assert, describe, it } from "vitest";
import { Maybe } from "../../../shared/utils/maybe";
import { Result } from "../../../shared/utils/result";
import { AccountRepoFake } from "../../repos/account/fake";
import { AccountQuery } from "./queries";

describe("Account Queries", () => {
	describe("list", () => {
		it("returns all accounts", () => {
			const repo = AccountRepoFake.init();
			const accountQuery = AccountQuery.init(repo);
			const accounts = accountQuery.list();

			assert.isAbove(accounts.length, 0);
			assert.property(accounts[0], "id");
			assert.property(accounts[0], "name");
			assert.property(accounts[0], "categoryId");
		});
	});

	describe("findById", () => {
		it("returns account when found", () => {
			const repo = AccountRepoFake.init();
			const accountQuery = AccountQuery.init(repo);
			const result = accountQuery.findById(2);

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
							assert.equal(account.id, 2);
							assert.equal(account.name, "Checking account");
						},
					);
				},
			);
		});

		it("returns none when account not found", () => {
			const repo = AccountRepoFake.init();
			const accountQuery = AccountQuery.init(repo);
			const result = accountQuery.findById(999);

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

		it("returns error when account is hidden", () => {
			const repo = AccountRepoFake.init();
			// Create a hidden account
			const account = repo.create({
				name: "HIDDEN_Secret",
				categoryId: 2,
			});

			const accountQuery = AccountQuery.init(repo);
			const result = accountQuery.findById(account.id);

			Result.match(
				result,
				(error) => {
					assert.deepEqual(error, {
						tag: "AccountHidden",
						accountId: account.id,
					});
				},
				() => {
					throw new Error("Expected Err");
				},
			);
		});
	});
});
