// Category domain types
import { Decoder } from "elm-decoders";

export type Category = {
	id: number;
	name: string;
	createdAt: number;
	updatedAt: number;
};

export type NewCategory = Omit<Category, "id" | "createdAt" | "updatedAt">;

export const categoryDecoder: Decoder<Category> = Decoder.object({
	id: Decoder.number,
	name: Decoder.string,
	createdAt: Decoder.number,
	updatedAt: Decoder.number,
});

export const categoriesDecoder: Decoder<Category[]> =
	Decoder.array(categoryDecoder);
