import { test, expect } from '@playwright/test';

test('two galleries, every photo described and loaded, continuing to /ishda', async ({ page }) => {
	await page.goto('/illustrations');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('ILLUSTRATIONS/ART/STUDIES');
	await expect(page.getByRole('heading', { name: /SKETCHES\/CONCEPTS\/EX\s*PERIMENTS/ })).toBeVisible();
	// Content images are described; frame backgrounds (grid paper) are decorative, alt="".
	const photos = page.locator('main .m img');
	expect(await photos.count()).toBeGreaterThanOrEqual(20);
	for (const alt of await photos.evaluateAll((els) => els.map((el) => el.getAttribute('alt')))) expect(alt?.trim()).toBeTruthy();
	for (const photo of await photos.all()) {
		await photo.scrollIntoViewIfNeeded();
		await expect.poll(() => photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
	}
	await page.getByRole('link', { name: 'CLICK ME TO CONTINUE' }).click();
	await expect(page).toHaveURL(/\/ishda$/);
});

test('on phones the galleries are one column', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/illustrations');
	const xs = await page.locator('main .m').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().x)));
	expect(xs.length).toBeGreaterThanOrEqual(20);
	expect(new Set(xs).size).toBe(1);
});
