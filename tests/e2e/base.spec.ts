import { test, expect } from '@playwright/test';

test('base layout loads the Canva fonts and colour tokens', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
	// document.fonts.check() is true for undeclared fonts, so look for loaded faces.
	const loaded = await page.evaluate(async () => {
		// Futura PT comes from Adobe Fonts in the weights the Canva design uses.
		const wanted: [string, string][] = [['futura-pt', '400'], ['futura-pt', '600'], ['futura-pt', '800'], ['Arimo', '700'], ['Montserrat Variable', '700']];
		await Promise.all(wanted.map(([family, weight]) => document.fonts.load(`${weight} 32px "${family}"`)));
		const faces = [...document.fonts].filter((f) => f.status === 'loaded');
		return wanted.map(([family, weight]) =>
			faces.some((f) => f.family.replace(/"/g, '') === family && (f.weight === weight || /\s/.test(f.weight))),
		);
	});
	expect(loaded).toEqual([true, true, true, true, true]);
	const red = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--red').trim());
	expect(red).toBe('#df2200');
	await expect(page.locator('#top')).toHaveCount(1);
});
