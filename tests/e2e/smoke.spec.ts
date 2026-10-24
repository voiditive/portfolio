import { test, expect } from '@playwright/test';

test('home responds', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page).toHaveTitle('Andrew Matthew Uy · Industrial Design Portfolio');
});
