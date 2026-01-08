import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	timeout: 30000,
	expect: {
		timeout: 5000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: "http://localhost:4173",
		trace: "on-first-retry",
		launchOptions: {
			slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
		},
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			grepInvert: /@mobile/, // Run everything EXCEPT @mobile tagged tests
		},
		{
			name: "mobile",
			use: { ...devices["Pixel 5"] },
			grep: /@mobile/, // Run ONLY @mobile tagged tests
		},
	],
	webServer: {
		command: "npm run build:client && vite preview",
		url: "http://localhost:4173",
		reuseExistingServer: !process.env.CI,
		stdout: "ignore",
		stderr: "pipe",
		env: {
			// These are required by vite.config.ts but not used with ?api=fake
			FE_PORT: "4173",
			FE_HOST: "localhost",
			BE_BASE_URL: "http://localhost:8086",
		},
	},
});
