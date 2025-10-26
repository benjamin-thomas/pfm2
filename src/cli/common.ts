// Common CLI utilities
import { AccountRepoFake } from "../server/repos/account/fake";
import type { AccountRepo } from "../server/repos/account/interface";
import { AccountRepoSql } from "../server/repos/account/sql";
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
	return (() => {
		switch (repoType) {
			case "fake":
				return AccountRepoFake.init();
			case "sql":
				return AccountRepoSql.init();
			/* v8 ignore next 2 */
			default:
				return impossibleBranch(repoType);
		}
	})();
};
