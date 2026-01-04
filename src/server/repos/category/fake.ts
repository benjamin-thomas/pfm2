import type { Category, NewCategory } from "../../../shared/category";
import type { IO } from "../../../shared/io/interface";
import { Maybe } from "../../../shared/utils/maybe";
import type { CategoryRepo } from "./interface";

const init = (io: IO, initialCategories: Category[]): CategoryRepo => {
	const categories: Category[] = [...initialCategories];
	let nextId =
		categories.length === 0 ? 1 : Math.max(...categories.map((c) => c.id)) + 1;

	return {
		listAll: (): Category[] => {
			return categories;
		},

		findById: (id: number): Maybe<Category> => {
			const category = categories.find((c) => c.id === id);
			return category ? Maybe.just(category) : Maybe.nothing;
		},

		deleteAll: () => {
			const count = categories.length;
			categories.length = 0;
			return { affectedRows: count };
		},

		createMany: (newCategories: NewCategory[]): Category[] => {
			const now = io.now();
			const created: Category[] = newCategories.map((cat) => ({
				id: nextId++,
				name: cat.name,
				createdAt: now,
				updatedAt: now,
			}));
			categories.push(...created);
			return created;
		},
	};
};

export const CategoryRepoFake = { init } as const;
