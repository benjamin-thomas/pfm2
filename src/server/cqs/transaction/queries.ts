// Transaction query handlers - read operations only
import type {
	Transaction,
	TransactionFilters,
} from "../../../shared/transaction";
import type { Maybe } from "../../../shared/utils/maybe";
import type { TransactionRepo } from "../../repos/transaction/interface";

export type TransactionQuery = {
	list(filters: Maybe<TransactionFilters>): Transaction[];
	findById(id: number): Maybe<Transaction>;
};

const init = (repo: TransactionRepo): TransactionQuery => {
	const list = (filters: Maybe<TransactionFilters>): Transaction[] => {
		return repo.list(filters);
	};

	const findById = (id: number): Maybe<Transaction> => {
		return repo.findById(id);
	};

	return {
		list,
		findById,
	};
};

export const TransactionQuery = { init } as const;
