import type { Category } from "../../../shared/category";
import type { IO } from "../../../shared/io/interface";
import { Maybe } from "../../../shared/utils/maybe";
import type { CategoryRepo } from "./interface";

const init = (_io: IO, initialCategories: Category[]): CategoryRepo => {
	const categories: Category[] = [...initialCategories];

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
