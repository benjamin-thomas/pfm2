import type { Category } from "../../../shared/category";
import type { Maybe } from "../../../shared/utils/maybe";

export interface CategoryRepo {
	listAll(): Category[];
	findById(id: number): Maybe<Category>;
}
