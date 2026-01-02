import { assert, describe, it } from "vitest";
import { makeFakeIO } from "../../../shared/io/fake";
import { Maybe } from "../../../shared/utils/maybe";
import { Result } from "../../../shared/utils/result";
import { AccountRepoFake } from "../../repos/account/fake";
import { AccountQuery } from "./queries";

describe("Account Queries", () => {
	describe("list", () => {
		it("returns all accounts", () => {
			const { io } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{ name: "Checking", categoryId: 1 },
				{ name: "Savings", categoryId: 2 },
			]);
			const accountQuery = AccountQuery.init(repo);
			const accounts = accountQuery.list();

			assert.deepEqual(accounts, [
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
		});
	});

	describe("findById", () => {
		it("returns account when found", () => {
			const { io } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{ name: "Checking", categoryId: 1 },
				{ name: "Savings", categoryId: 2 },
			]);
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
							assert.deepEqual(account, {
								id: 2,
								name: "Savings",
								categoryId: 2,
								createdAt: 1000,
								updatedAt: 1000,
							});
						},
					);
				},
			);
		});

		it("returns none when account not found", () => {
			const { io } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{ name: "Checking", categoryId: 1 },
			]);
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
			const { io, setTime } = makeFakeIO({ now: 1000 });
			const repo = AccountRepoFake.init(io, [
				{ name: "Checking", categoryId: 1 },
			]);

			// Create a hidden account
			setTime(2000);
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
