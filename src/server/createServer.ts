import express, { type Express } from "express";
import { AccountCommand } from "./cqs/account/commands";
import { AccountQuery } from "./cqs/account/queries";
import { BalanceQuery } from "./cqs/balance/queries";
import { LedgerQuery } from "./cqs/ledger/queries";
import { TransactionCommand } from "./cqs/transaction/commands";
import { TransactionQuery } from "./cqs/transaction/queries";
import type { Repos } from "./repos/initRepos";
import { registerAccountRoutes } from "./routes/accountRoutes";
import { registerAdminRoutes } from "./routes/adminRoutes";
import { registerBalanceRoutes } from "./routes/balanceRoutes";
import { registerLedgerRoutes } from "./routes/ledgerRoutes";
import { registerTransactionRoutes } from "./routes/transactionRoutes";

type CreateServerOptions = {
	corsOrigin: string;
};

const wakingUpHtml = (redirectUrl: string) => `
<!DOCTYPE html>
<html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="refresh" content="1;url=${redirectUrl}">
      <title>Waking up...</title>
    </head>
    <body>
      <p>Server is waking up. Redirecting...</p>
    </body>
</html>
`;

const wakingUpErrorHtml = () => `
<!DOCTYPE html>
<html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Backend unavailable</title>
    </head>
    <body>
      <p>Backend unavailable. Please try again later.</p>
    </body>
</html>
`;

export default (options: CreateServerOptions, repos: Repos): Express => {
	const app = express();

	// Middlewares
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// CORS
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", options.corsOrigin);
		res.header(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		);
		res.header("Access-Control-Allow-Headers", "Content-Type");

		if (req.method === "OPTIONS") {
			res.sendStatus(204);
			return;
		}
		next();
	});

	const { transactionRepo, accountRepo, balanceRepo, ledgerRepo } = repos;

	// Initialize CQS handlers
	const accountQuery = AccountQuery.init(accountRepo);
	const accountCommand = AccountCommand.init(accountRepo);
	const transactionQuery = TransactionQuery.init(transactionRepo);
	const transactionCommand = TransactionCommand.init(transactionRepo);
	const balanceQuery = BalanceQuery.init(balanceRepo);
	const ledgerQuery = LedgerQuery.init(ledgerRepo);

	// Routes
	app.get("/health", (_req, res) => {
		res.json({ status: "ok", timestamp: Date.now() });
	});

	// Waking-up endpoint: redirects back to the frontend after a (render.com) cold start
	const isValidReferer = (referer: string): boolean => {
		try {
			const refererOrigin = new URL(referer).origin;
			const allowedOrigins = options.corsOrigin.split(",").map((o) => o.trim());
			return allowedOrigins.includes(refererOrigin);
		} catch {
			return false;
		}
	};

	app.get("/waking-up", (req, res) => {
		let validatedReferer: string;
		{
			const refererRaw = req.get("Referer");
			if (!refererRaw || !isValidReferer(refererRaw)) {
				res.status(400).send("Invalid referer");
				return;
			}
			validatedReferer = refererRaw;
		}

		const attempt = parseInt(
			typeof req.query.attempt === "string" ? req.query.attempt : "0",
			10,
		);

		if (attempt >= 3) {
			res.status(503).send(wakingUpErrorHtml());
		} else {
			const redirectUrl = new URL(validatedReferer);
			redirectUrl.searchParams.set("_attempt", String(attempt + 1));
			res.send(wakingUpHtml(redirectUrl.toString()));
		}
	});

	app.get("/hello/:name", (req, res) => {
		res.json({ message: `Hello, ${req.params.name}!` });
	});

	registerTransactionRoutes(app, transactionQuery, transactionCommand);
	registerBalanceRoutes(app, balanceQuery);
	registerAccountRoutes(app, accountQuery, accountCommand);
	registerLedgerRoutes(app, ledgerQuery);
	registerAdminRoutes(app, repos);

	return app;
};
