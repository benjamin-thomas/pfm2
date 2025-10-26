import { assert, describe, it } from "vitest";
import { Result } from "./result";

describe("Result", () => {
	describe("match", () => {
		it("calls onErr for Err", () => {
			const result = Result.err("oops");
			const output = Result.match(
				result,
				(err) => `Error: ${err}`,
				(val) => `Success: ${val}`,
			);
			assert.strictEqual(output, "Error: oops");
		});

		it("calls onOk for Ok", () => {
			const result = Result.ok(42);
			const output = Result.match(
				result,
				(err) => `Error: ${err}`,
				(val) => `Success: ${val}`,
			);
			assert.strictEqual(output, "Success: 42");
		});
	});

	describe("map", () => {
		it("transforms the Ok value", () => {
			const result = Result.ok(5);
			const mapped = Result.map(result, (n) => n * 2);
			assert.deepStrictEqual(mapped, { tag: "Ok", value: 10 });
		});

		it("leaves Err untouched", () => {
			const result: Result<string, number> = Result.err("failed");
			const mapped = Result.map(result, (n) => n * 2);
			assert.deepStrictEqual(mapped, { tag: "Err", error: "failed" });
		});
	});
});
