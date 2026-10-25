import { test, expect } from '@playwright/test';

test('home responds', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page).toHaveTitle('Andrew Matthew Uy · Industrial Design Portfolio');
});

// Site links have no trailing slash: the host must serve them directly, not redirect.
for (const route of ['/pipboy', '/widw', '/illustrations', '/ishda', '/yume']) {
	test(`${route} is served without a redirect`, async ({ page }) => {
		const response = await page.goto(route);
		expect(response?.status()).toBe(200);
		expect(response?.request().redirectedFrom()).toBeNull();
	});
}
