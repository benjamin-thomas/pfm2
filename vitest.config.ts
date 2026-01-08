import { defineConfig } from "vitest/config";
import { sharedConfig } from "./vite.config.base";

export default defineConfig({
	...sharedConfig,
	test: {
		globals: false,
		environment: "happy-dom",
		exclude: ["e2e/**", "node_modules/**", "dist/**"],
		typecheck: {
			enabled: true,
		},
		coverage: {
			provider: "v8",
			reporter: ["text-summary", "html", "lcov"],
		},
	},
});
