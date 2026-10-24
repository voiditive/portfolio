import { test, expect } from '@playwright/test';

const LABELS = ['about me', 'pipboy', 'widw', 'illustrations', 'ishda', 'yume'];
const ROUTES: [string, string][] = [
	['/', 'about me'],
	['/pipboy', 'pipboy'],
	['/widw', 'widw'],
	['/illustrations', 'illustrations'],
	['/ishda', 'ishda'],
	['/yume', 'yume'],
];

test.describe('nav', () => {
	for (const [route, current] of ROUTES) {
		test(`${route} shows every page and marks ${current}`, async ({ page }) => {
			await page.goto(route);
			// On phones the menu starts collapsed.
			const toggle = page.getByRole('button', { name: 'Menu' });
			if (await toggle.isVisible()) await toggle.click();
			const nav = page.getByRole('navigation', { name: 'Pages' });
			await expect(nav.getByRole('link')).toHaveText(LABELS);
			await expect(nav.locator('[aria-current="page"]')).toHaveText(current);
		});
	}
});

test.describe('no horizontal scroll', () => {
	for (const width of [375, 1024, 1280, 1366, 1920]) {
		test(`at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			for (const [route] of ROUTES) {
				await page.goto(route);
				const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
				expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0);
			}
		});
	}
});

test('the phone menu opens and navigates', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Pages' });
	const toggle = page.getByRole('button', { name: 'Menu' });
	await expect(nav.getByRole('link', { name: 'widw' })).toBeHidden();
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await nav.getByRole('link', { name: 'widw' }).click();
	await expect(page).toHaveURL(/\/widw$/);
});

test('an unknown address shows the 404 page with a way home', async ({ page }) => {
	const response = await page.goto('/does-not-exist');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('not found', { ignoreCase: true });
	await page.getByRole('link', { name: 'Back to the portfolio' }).click();
	await expect(page).toHaveURL(/\/$/);
});
