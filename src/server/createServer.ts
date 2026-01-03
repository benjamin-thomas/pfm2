import express, { type Express } from "express";
import { AccountCommand } from "./cqs/account/commands";
import { AccountQuery } from "./cqs/account/queries";
import { BalanceQuery } from "./cqs/balance/queries";
import { LedgerQuery } from "./cqs/ledger/queries";
import { TransactionCommand } from "./cqs/transaction/commands";
import { TransactionQuery } from "./cqs/transaction/queries";
import type { Repos } from "./repos/initRepos";
import { registerAccountRoutes } from "./routes/accountRoutes";
import { registerBalanceRoutes } from "./routes/balanceRoutes";
import { registerLedgerRoutes } from "./routes/ledgerRoutes";
import { registerTransactionRoutes } from "./routes/transactionRoutes";

type CreateServerOptions = {
	corsOrigin: string;
};

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

	app.get("/hello/:name", (req, res) => {
		res.json({ message: `Hello, ${req.params.name}!` });
	});

	registerTransactionRoutes(app, transactionQuery, transactionCommand);
	registerBalanceRoutes(app, balanceQuery);
	registerAccountRoutes(app, accountQuery, accountCommand);
	registerLedgerRoutes(app, ledgerQuery);

	return app;
};
