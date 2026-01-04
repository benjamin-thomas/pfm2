import type { Category, NewCategory } from "../../../shared/category";
import type { Maybe } from "../../../shared/utils/maybe";

export type AffectedRows = { affectedRows: number };

export interface CategoryRepo {
	listAll(): Category[];
	findById(id: number): Maybe<Category>;
	deleteAll(): AffectedRows;
	createMany(categories: NewCategory[]): Category[];
}
