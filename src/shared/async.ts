// Async operation status - proper ADT

export type Status<T> =
	| { kind: "Loading" }
	| ({ kind: "Loaded" } & T)
	| { kind: "Error"; error: string };
