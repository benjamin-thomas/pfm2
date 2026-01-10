// Account domain types
import { Decoder } from "elm-decoders";

export type Account = {
	id: number;
	categoryId: number;
	name: string;
	position: number;
	createdAt: number;
	updatedAt: number;
};

export type NewAccount = Omit<Account, "id" | "createdAt" | "updatedAt">;

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
	position: number;
	balance: number; // in cents
};

// Decoders for runtime validation
export const accountDecoder: Decoder<Account> = Decoder.object({
	id: Decoder.number,
	categoryId: Decoder.number,
	name: Decoder.string,
	position: Decoder.number,
	createdAt: Decoder.number,
	updatedAt: Decoder.number,
});

export const accountsDecoder: Decoder<Account[]> =
	Decoder.array(accountDecoder);

export const accountBalanceDecoder: Decoder<AccountBalance> = Decoder.object({
	accountId: Decoder.number,
	accountName: Decoder.string,
	categoryId: Decoder.number,
	categoryName: Decoder.string,
	position: Decoder.number,
	balance: Decoder.number,
});

export const accountBalancesDecoder: Decoder<AccountBalance[]> = Decoder.array(
	accountBalanceDecoder,
);
