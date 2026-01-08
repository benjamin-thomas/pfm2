import { expect, type Locator, test } from "@playwright/test";

/**
 * Helper to simulate a swipe gesture on a touch device.
 * Uses dispatchEvent with TouchEvents as recommended by Playwright docs.
 */
async function swipe(locator: Locator, direction: "left" | "right", steps = 5) {
	const { centerX, centerY, width } = await locator.evaluate(
		(target: HTMLElement) => {
			const bounds = target.getBoundingClientRect();
			return {
				centerX: bounds.left + bounds.width / 2,
				centerY: bounds.top + bounds.height / 2,
				width: bounds.width,
			};
		},
	);

	// Calculate start and end X positions
	const deltaX = width * 0.6; // Swipe 60% of width
	const startX =
		direction === "left" ? centerX + deltaX / 2 : centerX - deltaX / 2;
	const endX =
		direction === "left" ? centerX - deltaX / 2 : centerX + deltaX / 2;

	// Start touch
	const startTouches = [{ identifier: 0, clientX: startX, clientY: centerY }];
	await locator.dispatchEvent("touchstart", {
		touches: startTouches,
		changedTouches: startTouches,
		targetTouches: startTouches,
	});

	// Move touch in steps
	for (let i = 1; i <= steps; i++) {
		const currentX = startX + ((endX - startX) * i) / steps;
		const moveTouches = [
			{ identifier: 0, clientX: currentX, clientY: centerY },
		];
		await locator.dispatchEvent("touchmove", {
			touches: moveTouches,
			changedTouches: moveTouches,
			targetTouches: moveTouches,
		});
	}

	// End touch
	await locator.dispatchEvent("touchend", {
		touches: [],
		changedTouches: [],
		targetTouches: [],
	});
}

test.describe("Balance cards carousel", () => {
	test.beforeEach(async ({ page }) => {
		// Use fake API - no backend needed
		await page.goto("/?api=fake");
		// Wait for balances to load
		await page.waitForSelector(".carousel-viewport");
	});

	test.describe("wheel navigation (desktop)", () => {
		test("shows hint text on hover", async ({ page }) => {
			const hint = page.locator(".carousel-wheel-hint");
			const viewport = page.locator(".carousel-viewport");

			// Initially hidden (opacity 0, no visible class)
			await expect(hint).not.toHaveClass(/carousel-wheel-hint--visible/);

			// Hover shows hint
			await viewport.hover();
			await expect(hint).toHaveClass(/carousel-wheel-hint--visible/);

			// Move away hides the hint
			await page.mouse.move(0, 0);
			await expect(hint).not.toHaveClass(/carousel-wheel-hint--visible/);
		});

		test("advances page on wheel down", async ({ page }) => {
			const viewport = page.locator(".carousel-viewport");
			const dots = page.locator(".carousel-dot");

			// Initially on the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);
			await expect(dots.nth(1)).not.toHaveClass(/carousel-dot--active/);

			// Scroll down
			await viewport.hover();
			await page.mouse.wheel(0, 100);

			// Now on the second page
			await expect(dots.first()).not.toHaveClass(/carousel-dot--active/);
			await expect(dots.nth(1)).toHaveClass(/carousel-dot--active/);
		});

		test("goes back on wheel up", async ({ page }) => {
			const viewport = page.locator(".carousel-viewport");
			const dots = page.locator(".carousel-dot");

			// Go to the second page first
			await viewport.hover();
			await page.mouse.wheel(0, 100);
			await expect(dots.nth(1)).toHaveClass(/carousel-dot--active/);

			// Wait for debounce to end (200ms) before scrolling back
			await page.waitForTimeout(250);

			// Scroll up
			await page.mouse.wheel(0, -100);

			// Back to the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);
		});

		test("does not scroll past first page", async ({ page }) => {
			const viewport = page.locator(".carousel-viewport");
			const dots = page.locator(".carousel-dot");

			// Already on the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);

			// Scroll up (should do nothing)
			await viewport.hover();
			await page.mouse.wheel(0, -100);

			// Still on the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);
		});

		test("does not scroll past last page", async ({ page }) => {
			const viewport = page.locator(".carousel-viewport");
			const dots = page.locator(".carousel-dot");
			const lastDot = dots.last();

			// Navigate to the last page via dots
			await lastDot.click();
			await expect(lastDot).toHaveClass(/carousel-dot--active/);

			// Scroll down (should do nothing)
			await viewport.hover();
			await page.mouse.wheel(0, 100);

			// Still on the last page
			await expect(lastDot).toHaveClass(/carousel-dot--active/);
		});
	});

	test.describe("dot navigation", () => {
		test("clicking dot navigates to that page", async ({ page }) => {
			const dots = page.locator(".carousel-dot");

			// Initially on the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);

			// Click on the third dot
			await dots.nth(2).click();
			await expect(dots.nth(2)).toHaveClass(/carousel-dot--active/);
			await expect(dots.first()).not.toHaveClass(/carousel-dot--active/);

			// Click on the first dot
			await dots.first().click();
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);
		});
	});

	test.describe("swipe navigation (mobile)", () => {
		test("@mobile swipe left advances to next page", async ({ page }) => {
			const viewport = page.locator(".carousel-viewport");
			const dots = page.locator(".carousel-dot");

			// Initially on the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);

			// Swipe left (finger moves from right to left)
			await swipe(viewport, "left");

			// Now on the second page
			await expect(dots.nth(1)).toHaveClass(/carousel-dot--active/);
		});

		test("@mobile swipe right goes to previous page", async ({ page }) => {
			const viewport = page.locator(".carousel-viewport");
			const dots = page.locator(".carousel-dot");

			// First, go to the second page via dot click
			await dots.nth(1).click();
			await expect(dots.nth(1)).toHaveClass(/carousel-dot--active/);

			// Swipe right (finger moves from left to right)
			await swipe(viewport, "right");

			// Back to the first page
			await expect(dots.first()).toHaveClass(/carousel-dot--active/);
		});
	});
});
