export interface IO {
	logInfo(...args: unknown[]): void;
	logErr(...args: unknown[]): void;
	now(): number;
}
