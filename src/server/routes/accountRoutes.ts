import type { Router } from "express";
import { Decoder } from "elm-decoders";
import { impossibleBranch } from "../../shared/utils/impossibleBranch";
import { DecoderUtil } from "../../shared/utils/decoder";
import { Maybe } from "../../shared/utils/maybe";
import { Result } from "../../shared/utils/result";
import type { AccountCommand } from "../cqs/account/commands";
import type { AccountQuery } from "../cqs/account/queries";

const newAccountDecoder = Decoder.object({
	name: Decoder.string,
	categoryId: Decoder.number,
	position: Decoder.number,
});

type NewAccountInput = { name: string; categoryId: number; position: number };

export const registerAccountRoutes = (
	router: Router,
	accountQuery: AccountQuery,
	accountCommand: AccountCommand,
): void => {
	// GET /api/accounts
	router.get("/api/accounts", (_req, res) => {
		try {
			const accounts = accountQuery.list();
			res.json(accounts);
		} catch (error) {
			console.error("Error in GET /api/accounts:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	// GET /api/accounts/:id
	router.get("/api/accounts/:id", (req, res) => {
		try {
			const id = parseInt(req.params.id, 10);
			if (Number.isNaN(id)) {
				res.status(400).json({ error: "Invalid account ID" });
				return;
			}

			const result = accountQuery.findById(id);

			Result.match(
				result,
				(error) => {
					switch (error.tag) {
						case "AccountHidden":
							res.status(403).json({ error: "Account is hidden" });
							break;
						/* v8 ignore next 2 */
						default:
							impossibleBranch(error.tag);
					}
				},
				(maybeAccount) => {
					Maybe.match(
						maybeAccount,
						() => {
							res.status(404).json({ error: "Account not found" });
						},
						(account) => {
							res.json(account);
						},
					);
				},
			);
		} catch (error) {
			console.error("Error in GET /api/accounts/:id:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	// POST /api/accounts
	router.post("/api/accounts", (req, res) => {
		try {
			const result = newAccountDecoder.run(req.body);

			DecoderUtil.match(
				result,
				(error) => {
					res
						.status(400)
						.json({ error: "Invalid account data", details: error });
				},
				(newAccount: NewAccountInput) => {
					const account = accountCommand.create(newAccount);
					res.status(201).json(account);
				},
			);
		} catch (error) {
			console.error("Error in POST /api/accounts:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	// PUT /api/accounts/:id
	router.put("/api/accounts/:id", (req, res) => {
		try {
			const id = parseInt(req.params.id, 10);
			if (Number.isNaN(id)) {
				res.status(400).json({ error: "Invalid account ID" });
				return;
			}

			const result = newAccountDecoder.run(req.body);

			DecoderUtil.match(
				result,
				(error) => {
					res
						.status(400)
						.json({ error: "Invalid account data", details: error });
				},
				(updates: NewAccountInput) => {
					const { affectedRows } = accountCommand.update(id, updates);

					if (affectedRows === 0) {
						res.status(404).json({ error: "Account not found" });
						return;
					}

					res.status(204).send();
				},
			);
		} catch (error) {
			console.error("Error in PUT /api/accounts/:id:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	// DELETE /api/accounts/:id
	router.delete("/api/accounts/:id", (req, res) => {
		try {
			const id = parseInt(req.params.id, 10);
			if (Number.isNaN(id)) {
				res.status(400).json({ error: "Invalid account ID" });
				return;
			}

			const result = accountCommand.delete(id);

			Result.match(
				result,
				(error) => {
					switch (error.tag) {
						case "AccountLocked":
							res
								.status(403)
								.json({ error: `Cannot delete locked account: ${error.name}` });
							break;
						/* v8 ignore next 2 */
						default:
							impossibleBranch(error.tag);
					}
				},
				(affectedRows) => {
					if (affectedRows.affectedRows === 0) {
						res.status(404).json({ error: "Account not found" });
					} else {
						res.status(204).send();
					}
				},
			);
		} catch (error) {
			console.error("Error in DELETE /api/accounts/:id:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});
};
