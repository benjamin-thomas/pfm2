// Helper for exhaustiveness checking
// This function is intentionally uncovered - it should never be reached if types are correct
/* v8 ignore next 3 */
export const impossibleBranch = (value: never): never => {
  throw new Error(`Impossible: ${value}`);
};
