import type { Category } from "../../../shared/category";
import { categoryRows } from "../../../shared/fakeData";
import { Maybe } from "../../../shared/utils/maybe";
import type { CategoryRepo } from "./interface";

const init = (): CategoryRepo => {
	const categories: Category[] = categoryRows.map((row) => ({
		id: row.id,
		name: row.name,
		createdAt: 0,
		updatedAt: 0,
	}));

	return {
		listAll: (): Category[] => {
			return categories;
		},

		findById: (id: number): Maybe<Category> => {
			const category = categories.find((c) => c.id === id);
			return category ? Maybe.just(category) : Maybe.nothing;
		},
	};
};

export const CategoryRepoFake = { init } as const;
