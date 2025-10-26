// Account and Category domain types
import { Decoder } from "elm-decoders";

export type Category = {
	categoryId: number;
	name: string;
	createdAt: number;
	updatedAt: number;
};

export type Account = {
	accountId: number;
	categoryId: number;
	name: string;
	createdAt: number;
	updatedAt: number;
};

export type NewAccount = Omit<Account, "accountId" | "createdAt" | "updatedAt">;

export type NewCategory = Omit<
	Category,
	"categoryId" | "createdAt" | "updatedAt"
>;

// View model with balance
export type AccountView = Account & {
	categoryName: string;
	balance: number; // in cents
};

// Balance read for dashboard
export type AccountBalance = {
	accountId: number;
	accountName: string;
	categoryId: number;
	categoryName: string;
	balance: number; // in cents
};

// Decoders for runtime validation
export const accountDecoder: Decoder<Account> = Decoder.object({
	accountId: Decoder.number,
	categoryId: Decoder.number,
	name: Decoder.string,
	createdAt: Decoder.number,
	updatedAt: Decoder.number,
});

export const accountsDecoder: Decoder<Account[]> =
	Decoder.array(accountDecoder);
