// Transaction command handlers - write operations only
import type {
	NewTransaction,
	Transaction,
	UpdateTransaction,
} from "../../../shared/transaction";
import type {
	AffectedRows,
	TransactionRepo,
} from "../../repos/transaction/interface";

export type TransactionCommand = {
	create(data: NewTransaction): Transaction;
	update(id: number, data: UpdateTransaction): AffectedRows;
	delete(id: number): AffectedRows;
	createMany(transactions: NewTransaction[]): Transaction[];
};

const init = (repo: TransactionRepo): TransactionCommand => {
	const create = (data: NewTransaction): Transaction => {
		return repo.create(data);
	};

	const update = (id: number, data: UpdateTransaction): AffectedRows => {
		return repo.update(id, data);
	};

	const delete_ = (id: number): AffectedRows => {
		return repo.delete(id);
	};

	const createMany = (transactions: NewTransaction[]): Transaction[] => {
		return repo.createMany(transactions);
	};

	return {
		create,
		update,
		delete: delete_,
		createMany,
	};
};

export const TransactionCommand = { init } as const;
