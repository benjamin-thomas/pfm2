// Common CLI utilities
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { AccountRepoFake } from "../server/repos/account/fake";
import type { AccountRepo } from "../server/repos/account/interface";
import { AccountRepoSql } from "../server/repos/account/sql";
import { RealIO } from "../shared/io/real";
import { impossibleBranch } from "../shared/utils/impossibleBranch";

// Define list first, then derive type from it using typeof and indexed access
// REPO_VARIANTS[number] extracts the union type: 'fake' | 'sql'
// See: https://stackoverflow.com/a/55505556
export const REPO_VARIANTS = ["fake", "sql"] as const;
export type REPO_VARIANT = (typeof REPO_VARIANTS)[number];

export const isValidRepoVariant = (value?: string): value is REPO_VARIANT => {
	return REPO_VARIANTS.includes(value as REPO_VARIANT);
};

export const makeAccountRepoOrThrow = (repoType: REPO_VARIANT): AccountRepo => {
	switch (repoType) {
		case "fake":
			return AccountRepoFake.init(RealIO, []);
		case "sql": {
			const dbPath = process.env.DB_PATH;
			if (!dbPath) {
				throw new Error(
					"Missing mandatory env var: DB_PATH (required when REPO=sql)",
				);
			}
			const db = new Database(dbPath);
			db.exec(readFileSync("sql/init.sql", "utf-8"));
			return AccountRepoSql.init(db);
		}
		/* v8 ignore next 2 */
		default:
			return impossibleBranch(repoType);
	}
};
