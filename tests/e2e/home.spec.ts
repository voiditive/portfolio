import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

/** Extent of the white text ink in a clip: rows with at least `min` white pixels, and the columns they cover. */
async function ink(page: Page, clip: { x: number; y: number; width: number; height: number }, min = 300) {
	const png = await page.screenshot({ clip, fullPage: true });
	const { data, info } = await sharp(png).resize({ width: clip.width }).raw().toBuffer({ resolveWithObject: true });
	const rows: number[] = [];
	let left = Infinity;
	let right = -Infinity;
	for (let y = 0; y < info.height; y++) {
		const xs: number[] = [];
		for (let x = 0; x < info.width; x++) {
			const i = (y * info.width + x) * info.channels;
			if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) xs.push(x);
		}
		if (xs.length < min) continue;
		rows.push(clip.y + y);
		left = Math.min(left, clip.x + xs[0]);
		right = Math.max(right, clip.x + xs.at(-1)!);
	}
	return { top: rows[0], bottom: rows.at(-1), left, right };
}

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
	// Canva: PORTFOLIO at left 350.9, top 163.4, width 664.3 in the first frame, below
	// the 56 px nav. One-line centred text is anchored by its centre, so a slightly
	// wider web font spills evenly: check the centre, not the edges.
	expect(Math.abs(box.x + box.width / 2 - (350.9 + 664.3 / 2))).toBeLessThanOrEqual(2);
	// Its capitals span the rows they do in the Canva export (measured at 1366: rows 248
	// to 368, columns 352 to 1019), centred on the same column.
	const text = await ink(page, { x: 320, y: 242, width: 740, height: 135 });
	expect(Math.abs(text.top! - 248)).toBeLessThanOrEqual(3);
	// Within the plan's 4 px: League Spartan's side bearings differ a little from Canva's font.
	expect(Math.abs((text.left + text.right) / 2 - (352 + 1019) / 2)).toBeLessThanOrEqual(4);
	expect(Math.abs(text.bottom! - 368)).toBeLessThanOrEqual(3);
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
