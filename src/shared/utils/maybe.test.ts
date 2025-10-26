import { assert, describe, it } from "vitest";
import { Maybe } from "./maybe";

describe("Maybe", () => {
	describe("match", () => {
		it("executes onJust branch for Just values", () => {
			const result = Maybe.match(
				Maybe.just(42),
				() => 0,
				(value) => value * 2,
			);
			assert.equal(result, 84);
		});

		it("executes onNothing branch for Nothing values", () => {
			const result = Maybe.match(
				Maybe.nothing,
				() => "default",
				(value: number) => `value: ${value}`,
			);
			assert.equal(result, "default");
		});

		it("nothing is a singleton", () => {
			assert.strictEqual(Maybe.nothing, Maybe.nothing);
		});
	});
});
