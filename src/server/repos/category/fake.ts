import type { Category, NewCategory } from "../../../shared/category";
import type { IO } from "../../../shared/io/interface";
import { Maybe } from "../../../shared/utils/maybe";
import type { CategoryRepo } from "./interface";

const init = (io: IO, initialCategories: NewCategory[]): CategoryRepo => {
	const now = io.now();
	const categories: Category[] = initialCategories.map((cat, index) => ({
		...cat,
		id: index + 1,
		createdAt: now,
		updatedAt: now,
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
