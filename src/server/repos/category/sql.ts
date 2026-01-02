// SQLite category repository implementation

import type { Database } from "better-sqlite3";
import {
	type Category,
	categoriesDecoder,
	categoryDecoder,
} from "../../../shared/category";
import { Maybe } from "../../../shared/utils/maybe";
import type { CategoryRepo } from "./interface";

const init = (db: Database): CategoryRepo => {
	return {
		listAll: (): Category[] => {
			const query = `
				SELECT category_id AS id
				     , name
				     , created_at AS createdAt
				     , updated_at AS updatedAt
				FROM categories
			`;
			return categoriesDecoder.guard(db.prepare(query).all());
		},

		findById: (id: number): Maybe<Category> => {
			const query = `
				SELECT category_id AS id
				     , name
				     , created_at AS createdAt
				     , updated_at AS updatedAt
				FROM categories
				WHERE category_id = ?
			`;
			const row = db.prepare(query).get(id);
			return row ? Maybe.just(categoryDecoder.guard(row)) : Maybe.nothing;
		},
	};
};

export const CategoryRepoSql = { init } as const;
