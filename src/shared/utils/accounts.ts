/**
 * Check if an account is a placeholder for uncategorized transactions.
 *
 * Unknown accounts are used when importing OFX files or creating
 * transactions where the income source or expense category is not yet known.
 */
export const isUnknownAccount = (accountName: string): boolean => {
	return accountName === "Unknown_EXPENSE" || accountName === "Unknown_INCOME";
};
