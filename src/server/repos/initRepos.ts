// Repository factory - creates fake or SQL repos based on REPO env var

import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import * as FakeData from "../../shared/fakeData";
import { RealIO } from "../../shared/io/real";
import { impossibleBranch } from "../../shared/utils/impossibleBranch";
import { AccountRepoFake } from "./account/fake";
import type { AccountRepo } from "./account/interface";
import { AccountRepoSql } from "./account/sql";
import { BalanceRepoFake } from "./balance/fake";
import type { BalanceRepo } from "./balance/interface";
import { BalanceRepoSql } from "./balance/sql";
import { CategoryRepoFake } from "./category/fake";
import type { CategoryRepo } from "./category/interface";
import { CategoryRepoSql } from "./category/sql";
import { LedgerRepoFake } from "./ledger/fake";
import type { LedgerRepo } from "./ledger/interface";
import { LedgerRepoSql } from "./ledger/sql";
import { TransactionRepoFake } from "./transaction/fake";
import type { TransactionRepo } from "./transaction/interface";
import { TransactionRepoSql } from "./transaction/sql";

export const REPO_VARIANTS = ["fake", "sql"] as const;
export type RepoVariant = (typeof REPO_VARIANTS)[number];

export const isValidRepoVariant = (value?: string): value is RepoVariant => {
	return REPO_VARIANTS.includes(value as RepoVariant);
};

export type Repos = {
	transactionRepo: TransactionRepo;
	accountRepo: AccountRepo;
	categoryRepo: CategoryRepo;
	balanceRepo: BalanceRepo;
	ledgerRepo: LedgerRepo;
};

const initFakeRepos = (): Repos => {
	const clock = { now: () => RealIO.now() };
	const { categoryRows, categoryNameToId } = FakeData.makeCategoryRows(clock);
	const { accountRows, accountNameToId } = FakeData.makeAccountRows(
		clock,
		categoryNameToId,
	);
	const transactionRows = FakeData.makeTransactionRows(clock, accountNameToId);

	const transactionRepo = TransactionRepoFake.init(RealIO, transactionRows);
	const accountRepo = AccountRepoFake.init(RealIO, accountRows);
	const categoryRepo = CategoryRepoFake.init(RealIO, categoryRows);
	const balanceRepo = BalanceRepoFake.init(
		transactionRepo,
		accountRepo,
		categoryRepo,
	);
	const ledgerRepo = LedgerRepoFake.init(transactionRepo, accountRepo);

	return {
		transactionRepo,
		accountRepo,
		categoryRepo,
		balanceRepo,
		ledgerRepo,
	};
};

const initSqlRepos = (): Repos => {
	const dbPath = process.env.DB_PATH;
	if (!dbPath) {
		throw new Error(
			"Missing mandatory env var: DB_PATH (required when REPO=sql)",
		);
	}

	const db = new Database(dbPath);
	db.exec(readFileSync("sql/init.sql", "utf-8"));
	db.exec(readFileSync("sql/seed.sql", "utf-8"));

	const transactionRepo = TransactionRepoSql.init(db);
	const accountRepo = AccountRepoSql.init(db);
	const categoryRepo = CategoryRepoSql.init(db);
	const balanceRepo = BalanceRepoSql.init(db);
	const ledgerRepo = LedgerRepoSql.init(db);

	return {
		transactionRepo,
		accountRepo,
		categoryRepo,
		balanceRepo,
		ledgerRepo,
	};
};

const initRepos = (repoType: RepoVariant): Repos => {
	switch (repoType) {
		case "fake":
			return initFakeRepos();
		case "sql":
			return initSqlRepos();
		/* v8 ignore next 2 */
		default:
			return impossibleBranch(repoType);
	}
};

export const initReposOrAbort = (): Repos => {
	const repoType = process.env.REPO;
	if (!isValidRepoVariant(repoType)) {
		console.error(`Invalid REPO env var: ${repoType}. Must be 'fake' or 'sql'`);
		process.exit(1);
	}
	console.log(`📦 Using ${repoType} repositories`);
	return initRepos(repoType);
};
