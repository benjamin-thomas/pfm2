// Budget domain types

export type Budget = {
	budgetId: number;
	startsOn: number; // Unix timestamp
	endsOn: number; // Unix timestamp
	createdAt: number;
	updatedAt: number;
};

export type BudgetLine = {
	budgetLineId: number;
	budgetId: number;
	accountId: number;
	cents: number; // Allocated amount
	createdAt: number;
	updatedAt: number;
};

export type NewBudget = Omit<Budget, "budgetId" | "createdAt" | "updatedAt">;

export type NewBudgetLine = Omit<
	BudgetLine,
	"budgetLineId" | "createdAt" | "updatedAt"
>;

export type UpdateBudget = Omit<Budget, "budgetId" | "createdAt" | "updatedAt">;

export type UpdateBudgetLine = Omit<
	BudgetLine,
	"budgetLineId" | "createdAt" | "updatedAt"
>;
