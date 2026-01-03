// https://vitest.dev/guide/environment#test-environment
// @vitest-environment node

import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import createServer from "../../server/createServer.ts";
import { makeSqlRepos } from "../../server/repos/initRepos";
import type { Account } from "../../shared/account";
import type { Transaction } from "../../shared/transaction";
import { Result } from "../../shared/utils/result";
import { ApiHttp } from "./http";
import type { Api } from "./interface";

// Integration test: HTTP client against real Express server
// This ensures the client correctly handles actual server responses

type TestContext = {
	api: Api;
	accounts: Account[];
	accountNameToId: (name: string) => number;
};

// Don't convert to an async function, it's less readable
const onServerCreate = <T>(
	fn: (ctx: TestContext) => Promise<T>,
): Promise<T> => {
	const db = new Database(":memory:");
	db.exec(readFileSync("sql/init.sql", "utf-8"));
	db.exec(readFileSync("sql/seed.sql", "utf-8"));

	const repos = makeSqlRepos(db);
	const app = createServer({ corsOrigin: "*" }, repos);
	const server = app.listen(0);
	const port = (server.address() as AddressInfo).port;
	const api = ApiHttp.init(`http://localhost:${port}`);

	return api.accounts
		.list()
		.then((accountsResult) =>
			Result.match(
				accountsResult,
				(err) =>
					Promise.reject(new Error(`Failed to fetch accounts: ${err.tag}`)),
				(accounts) => {
					const accountNameToId = (name: string): number => {
						const acc = accounts.find((a) => a.name === name);
						if (!acc) throw new Error(`Account not found: ${name}`);
						return acc.id;
					};
					return fn({ api, accounts, accountNameToId });
				},
			),
		)
		.finally(() => server.close());
};

const listTransactions = async (api: Api): Promise<Transaction[]> => {
	const result = await api.transactions.list({ searchTerm: "" });
	return Result.match(
		result,
		() => {
			throw new Error("Failed to list transactions");
		},
		(txs) => txs,
	);
};

describe("HTTP Client against Real Server", () => {
	it("transactions.create returns Ok on 201 and transaction is persisted", () =>
		onServerCreate(async ({ api, accountNameToId }) => {
			const uniqueDescr = `Create test ${Date.now()}`;
			const result = await api.transactions.create({
				fromAccountId: accountNameToId("Employer ABC"),
				toAccountId: accountNameToId("Checking account"),
				date: 1700000000,
				descr: uniqueDescr,
				cents: 100000,
			});
			expect(result).toEqual({ tag: "Ok", value: null });

			// Verify transaction was persisted
			const txs = await listTransactions(api);
			const created = txs.find((t) => t.descr === uniqueDescr);
			expect(created).toBeDefined();
			expect(created?.cents).toBe(100000);
		}));

	it("transactions.update returns Ok on 204 and verifies by refetching", () =>
		onServerCreate(async ({ api, accountNameToId }) => {
			const uniqueDescr = `Update test ${Date.now()}`;

			// Create a transaction
			await api.transactions.create({
				fromAccountId: accountNameToId("Employer ABC"),
				toAccountId: accountNameToId("Checking account"),
				date: 1700000000,
				descr: uniqueDescr,
				cents: 5000,
			});

			// Find the transaction we just created
			const txsBefore = await listTransactions(api);
			const tx = txsBefore.find((t) => t.descr === uniqueDescr);
			if (!tx) throw new Error("Transaction not found after create");

			// Update it
			const result = await api.transactions.update(tx.id, {
				fromAccountId: accountNameToId("Employer ABC"),
				toAccountId: accountNameToId("Checking account"),
				date: 1700000000,
				descr: "Updated description",
				cents: 6000,
			});

			expect(result).toEqual({ tag: "Ok", value: null });

			// Verify by refetching
			const txsAfter = await listTransactions(api);
			const updated = txsAfter.find((t) => t.id === tx.id);
			expect(updated?.descr).toBe("Updated description");
			expect(updated?.cents).toBe(6000);
		}));

	it("transactions.delete returns Ok on 204 and verifies by counting", () =>
		onServerCreate(async ({ api, accountNameToId }) => {
			const uniqueDescr = `Delete test ${Date.now()}`;

			// Create a transaction to delete
			await api.transactions.create({
				fromAccountId: accountNameToId("Employer ABC"),
				toAccountId: accountNameToId("Checking account"),
				date: 1700000000,
				descr: uniqueDescr,
				cents: 1000,
			});

			// Find the transaction and count before delete
			const txsBefore = await listTransactions(api);
			const tx = txsBefore.find((t) => t.descr === uniqueDescr);
			if (!tx) throw new Error("Transaction not found after create");
			const countBefore = txsBefore.length;

			// Delete it
			const result = await api.transactions.delete(tx.id);
			expect(result).toEqual({ tag: "Ok", value: null });

			// Verify by counting after delete
			const txsAfter = await listTransactions(api);
			expect(txsAfter.length).toBe(countBefore - 1);
			expect(txsAfter.find((t) => t.id === tx.id)).toBeUndefined();
		}));
});
