import { test, expect } from '@playwright/test';

test('the cover shows the portfolio title', async ({ page }) => {
	await page.goto('/');
	const main = page.locator('main');
	for (const text of ['MY INDUSTRIAL DESIGN', 'PORTFOLIO', 'MY DESIGN PROCESS', '(UY, ANDREW MATTHEW)']) {
		await expect(main).toContainText(text);
	}
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('PORTFOLIO');
});

test('about me has the intro, contact links and CV', async ({ page }) => {
	await page.goto('/');
	const about = page.locator('#about');
	await expect(about).toContainText(/I.M ANDREW/);
	await expect(about.locator('a[href="tel:+639393573880"]')).toHaveCount(1);
	await expect(about.locator('a[href="mailto:uy.andreuy@gmail.com"]')).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'LEARN MORE HERE' })).toHaveAttribute(
		'href',
		'https://drive.google.com/file/d/17BG8bozSRukMAXM4ZNurV2sGvoGaW5i2/view?usp=sharing',
	);
});

test('the four project cards link to their pages in card order', async ({ page }) => {
	await page.goto('/');
	const main = page.locator('main');
	for (const label of ['(01)', '(02)', '(03)', '(04)']) await expect(main).toContainText(label);
	const xs: number[] = [];
	for (const href of ['/pipboy', '/widw', '/yume', '/ishda']) {
		const card = main.locator(`a[href="${href}"]:has(img)`);
		await expect(card).toHaveCount(1);
		xs.push((await card.boundingBox())!.x);
	}
	if (page.viewportSize()!.width >= 1024) expect([...xs].sort((a, b) => a - b)).toEqual(xs);
});

test('the about me nav link jumps to the about section', async ({ page }) => {
	await page.goto('/pipboy');
	const toggle = page.getByRole('button', { name: 'Menu' });
	if (await toggle.isVisible()) await toggle.click();
	await page.getByRole('navigation', { name: 'Pages' }).getByRole('link', { name: 'about me' }).click();
	await expect(page).toHaveURL(/\/#about$/);
	await expect(page.locator('#about')).toBeInViewport();
});

test('on desktop, blocks sit at their Canva position', async ({ page }) => {
	test.skip(page.viewportSize()!.width !== 1366, 'measured at the Canva width');
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
	const box = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
	// Canva: PORTFOLIO at left 350.9, top 163.4 in the first frame, below the 56 px nav.
	expect(Math.abs(box.x - 350.9)).toBeLessThanOrEqual(2);
	expect(Math.abs(box.y - (56 + 163.4))).toBeLessThanOrEqual(2);
	expect(Math.abs(box.width - 664.3)).toBeLessThanOrEqual(2);
});

test('on phones, body text is at least 16px', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/');
	const sizes = await page.locator('main p').evaluateAll((els) =>
		els.filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => parseFloat(getComputedStyle(el).fontSize)),
	);
	expect(sizes.length).toBeGreaterThan(10);
	expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
});
