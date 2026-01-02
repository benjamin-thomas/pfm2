import type { Router } from "express";
import type { LedgerQuery } from "../cqs/ledger/queries";

export const registerLedgerRoutes = (
	router: Router,
	ledgerQuery: LedgerQuery,
): void => {
	router.get("/api/ledger/:accountId", (req, res) => {
		try {
			const accountId = parseInt(req.params.accountId, 10);
			if (Number.isNaN(accountId)) {
				res.status(400).json({ error: "Invalid account ID" });
				return;
			}

			const ledger = ledgerQuery.getLedgerForAccount(accountId);
			res.json(ledger);
		} catch (error) {
			console.error("Error in GET /api/ledger/:accountId:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});
};
