import {
	transactionDecoder,
	transactionsDecoder,
} from "../../shared/transaction";
import { DecoderUtil } from "../../shared/utils/decoder";
import { Maybe } from "../../shared/utils/maybe";
import { Result } from "../../shared/utils/result";
import type { Api } from "./interface";
import { ApiErr } from "./interface";

// HTTP API that talks to the backend server
// baseUrl is empty in the browser env (uses relative URLs), but is set for the Node.js test runner.

const init = (baseUrl = ""): Api => {
	return {
		transactions: {
			list: async ({ searchTerm }) => {
				try {
					const res = await fetch(
						`${baseUrl}/api/transactions?search=${searchTerm}`,
					);
					if (res.status === 200) {
						const data = await res.json();
						const decoded = transactionsDecoder.run(data);
						return DecoderUtil.toResult(decoded, (error) => {
							console.error("Decode error (transactions.list):", error);
							return ApiErr.badRequest("Invalid response format");
						});
					}
					if (res.status === 404) return Result.err(ApiErr.notFound);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (transactions.list):", error);
					return Result.err(ApiErr.serverError);
				}
			},

			findById: async (id: number) => {
				try {
					const res = await fetch(`${baseUrl}/api/transactions/${id}`);
					if (res.status === 200) {
						const data = await res.json();
						const decoded = transactionDecoder.run(data);
						return Result.map(
							DecoderUtil.toResult(decoded, (error) => {
								console.error("Decode error (transactions.findById):", error);
								return ApiErr.badRequest("Invalid response format");
							}),
							(transaction) => Maybe.just(transaction),
						);
					}
					if (res.status === 404) return Result.ok(Maybe.nothing);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (transactions.findById):", error);
					return Result.err(ApiErr.serverError);
				}
			},

			create: async (transaction) => {
				try {
					const res = await fetch(`${baseUrl}/api/transactions`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(transaction),
					});
					if (res.status === 201) {
						return Result.ok(null);
					}
					if (res.status === 400)
						return Result.err(ApiErr.badRequest("Invalid transaction data"));
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (transactions.create):", error);
					return Result.err(ApiErr.serverError);
				}
			},

			update: async (id, transaction) => {
				try {
					const res = await fetch(`${baseUrl}/api/transactions/${id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(transaction),
					});
					if (res.status === 204) {
						return Result.ok(null);
					}
					if (res.status === 404) return Result.err(ApiErr.notFound);
					if (res.status === 400)
						return Result.err(ApiErr.badRequest("Invalid transaction data"));
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (transactions.update):", error);
					return Result.err(ApiErr.serverError);
				}
			},

			delete: async (id) => {
				try {
					const res = await fetch(`${baseUrl}/api/transactions/${id}`, {
						method: "DELETE",
					});
					if (res.status === 204) return Result.ok(null);
					if (res.status === 404) return Result.err(ApiErr.notFound);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (transactions.delete):", error);
					return Result.err(ApiErr.serverError);
				}
			},
		},

		balances: {
			getBalances: async () => {
				try {
					const res = await fetch(`${baseUrl}/api/balances`);
					if (res.status === 200) {
						const data = await res.json();
						return Result.ok(data);
					}
					if (res.status === 404) return Result.err(ApiErr.notFound);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (balances.getBalances):", error);
					return Result.err(ApiErr.serverError);
				}
			},
		},

		ledger: {
			getLedgerForAccount: async (accountId: number) => {
				try {
					const res = await fetch(`${baseUrl}/api/ledger/${accountId}`);
					if (res.status === 200) {
						const data = await res.json();
						return Result.ok(data);
					}
					if (res.status === 404) return Result.err(ApiErr.notFound);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (ledger.getLedgerForAccount):", error);
					return Result.err(ApiErr.serverError);
				}
			},
		},

		accounts: {
			list: async () => {
				try {
					const res = await fetch(`${baseUrl}/api/accounts`);
					if (res.status === 200) {
						const data = await res.json();
						return Result.ok(data);
					}
					if (res.status === 404) return Result.err(ApiErr.notFound);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (accounts.list):", error);
					return Result.err(ApiErr.serverError);
				}
			},
		},

		admin: {
			resetData: async () => {
				try {
					const res = await fetch(`${baseUrl}/api/admin/reset`, {
						method: "POST",
					});
					if (res.status === 204) return Result.ok(null);
					if (res.status >= 500) return Result.err(ApiErr.serverError);
					return Result.err(ApiErr.badRequest("Bad request"));
				} catch (error) {
					console.error("API error (admin.resetData):", error);
					return Result.err(ApiErr.serverError);
				}
			},
		},
	};
};

export const ApiHttp = { init };
