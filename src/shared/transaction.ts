// Transaction domain types
import { Decoder } from "elm-decoders";

export type Transaction = {
	id: number;
	fromAccountId: number;
	toAccountId: number;
	date: number; // Unix timestamp
	descr: string;
	cents: number;
	createdAt: number;
	updatedAt: number;
};

// View model with joined account/category names
export type TransactionView = Transaction & {
	fromAccountName: string;
	toAccountName: string;
	fromCategoryName: string;
	toCategoryName: string;
	amountFormatted: string;
};

// Query filters
export type TransactionFilters = {
	fromAccountId?: number;
	toAccountId?: number;
	startDate?: number;
	endDate?: number;
	search?: string;
};

// Decoders for runtime validation
export const transactionDecoder: Decoder<Transaction> = Decoder.object({
	id: Decoder.number,
	fromAccountId: Decoder.number,
	toAccountId: Decoder.number,
	date: Decoder.number,
	descr: Decoder.string,
	cents: Decoder.number,
	createdAt: Decoder.number,
	updatedAt: Decoder.number,
});

export const transactionsDecoder: Decoder<Transaction[]> =
	Decoder.array(transactionDecoder);

export type NewTransaction = Omit<
	Transaction,
	"id" | "createdAt" | "updatedAt"
>;

export const newTransactionDecoder: Decoder<NewTransaction> = Decoder.object({
	fromAccountId: Decoder.number,
	toAccountId: Decoder.number,
	date: Decoder.number,
	descr: Decoder.string,
	cents: Decoder.number,
});

export type UpdateTransaction = Omit<
	Transaction,
	"id" | "createdAt" | "updatedAt"
>;

export const updateTransactionDecoder: Decoder<UpdateTransaction> =
	Decoder.object({
		fromAccountId: Decoder.number,
		toAccountId: Decoder.number,
		date: Decoder.number,
		descr: Decoder.string,
		cents: Decoder.number,
	});
