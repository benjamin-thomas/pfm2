import { describe, expect, it } from "vitest";
import { formatMoney } from "./translations";

describe("formatMoney", () => {
	it("formats euros with en-US separators and suffix", () => {
		expect(formatMoney("en", 123456)).toBe("1,234.56\u00a0€");
		expect(formatMoney("en", 1200)).toBe("12.00\u00a0€");
	});

	it("formats euros with fr-FR separators and suffix", () => {
		expect(formatMoney("fr", 123456)).toBe("1\u202f234,56\u00a0€");
		expect(formatMoney("fr", 1200)).toBe("12,00\u00a0€");
	});
});
