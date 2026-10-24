import { test, expect } from '@playwright/test';

test('base layout loads the Canva fonts and colour tokens', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
	// document.fonts.check() is true for undeclared fonts, so look for loaded faces.
	const loaded = await page.evaluate(async () => {
		const families = ['League Spartan Variable', 'Arimo', 'Montserrat Variable'];
		await Promise.all(families.map((family) => document.fonts.load(`700 32px "${family}"`)));
		const faces = [...document.fonts];
		return families.map((family) => faces.some((f) => f.family.replace(/"/g, '') === family && f.status === 'loaded'));
	});
	expect(loaded).toEqual([true, true, true]);
	const red = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--red').trim());
	expect(red).toBe('#df2200');
	await expect(page.locator('#top')).toHaveCount(1);
});
