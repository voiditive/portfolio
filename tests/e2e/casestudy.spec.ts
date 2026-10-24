import { test, expect, type Page } from '@playwright/test';

/** Visible heading texts of the page, whitespace collapsed. */
async function headings(page: Page) {
	const texts = await page.locator('main').getByRole('heading').allInnerTexts();
	return texts.map((t) => t.replace(/\s+/g, ' ').trim());
}

/** True when `wanted` appears in `list` in this order (other items may sit between). */
const inOrder = (list: string[], wanted: string[]) => {
	let i = 0;
	for (const item of list) if (item === wanted[i]) i++;
	return i === wanted.length;
};

test.describe('/pipboy', () => {
	test('has the case study headings in order, titled PIP-BOY 3000', async ({ page }) => {
		await page.goto('/pipboy');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('PIP-BOY 3000');
		const list = await headings(page);
		const wanted = ['PIP-BOY 3000', 'PROBLEM', 'CREATIVE & FUN PROGRESS', 'PRODUCT DETAILS', 'PRODUCT USAGE SCENARIO'];
		expect(inOrder(list, wanted), list.join(' | ')).toBe(true);
		// Timeline labels are not headings.
		expect(list).not.toContain('start');
	});

	test('continues to /widw', async ({ page }) => {
		await page.goto('/pipboy');
		await page.getByRole('link', { name: 'CLICK ME TO CONTINUE' }).click();
		await expect(page).toHaveURL(/\/widw$/);
	});

	test('longer intro text pushes the next section down instead of overlapping it', async ({ page }) => {
		await page.goto('/pipboy');
		const result = await page.evaluate(() => {
			const section = document.querySelectorAll('main section.cs')[1] as HTMLElement;
			const paragraphs = [...section.querySelectorAll('p')];
			const intro = paragraphs.sort((a, b) => b.textContent!.length - a.textContent!.length)[0];
			intro.textContent = `${intro.textContent} ${intro.textContent} ${intro.textContent}`;
			const next = section.nextElementSibling as HTMLElement;
			return {
				introBottom: intro.offsetTop + intro.offsetHeight,
				sectionBottom: section.offsetTop + section.offsetHeight,
				nextTop: next.offsetTop,
			};
		});
		expect(result.introBottom).toBeLessThanOrEqual(result.sectionBottom);
		expect(result.sectionBottom).toBeLessThanOrEqual(result.nextTop);
	});

	test('a portrait photo fills the first timeline slot without changing its size', async ({ page }) => {
		await page.goto('/pipboy');
		const timeline = page.locator('main section.cs').filter({ hasText: 'CREATIVE' }).first();
		const img = timeline.locator('.m img').first();
		await img.scrollIntoViewIfNeeded();
		const before = (await img.boundingBox())!;
		await img.evaluate(async (el: HTMLImageElement) => {
			const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1800"><rect width="600" height="1800" fill="teal"/></svg>`;
			el.removeAttribute('srcset');
			el.removeAttribute('width');
			el.removeAttribute('height');
			el.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
			await el.decode();
		});
		const after = (await img.boundingBox())!;
		expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
		expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
	});

	test('on phones the timeline stacks in one column with readable text', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/pipboy');
		const timeline = page.locator('main section.cs').filter({ hasText: 'CREATIVE' }).first();
		const xs = await timeline.locator('.b').evaluateAll((els) =>
			els.filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => Math.round(el.getBoundingClientRect().x)),
		);
		expect(xs.length).toBeGreaterThan(3);
		expect(new Set(xs).size).toBe(1);
		const sizes = await page.locator('main p').evaluateAll((els) =>
			els.filter((el) => (el as HTMLElement).offsetParent !== null).map((el) => parseFloat(getComputedStyle(el).fontSize)),
		);
		expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
	});
});

test.describe('/widw', () => {
	test('has its title, role, outcome and team', async ({ page }) => {
		await page.goto('/widw');
		const main = page.locator('main');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('WORLD INDUSTRIAL DESIGN WEEK 2026');
		const list = await headings(page);
		expect(inOrder(list, ['MY ROLE', 'THE OUTCOME']), list.join(' | ')).toBe(true);
		for (const point of ['Creative Direction', 'Publications Management', 'Team Collaboration']) await expect(main).toContainText(point);
		// Canva's team frame lists ten people (the plan said 11; the design has 10).
		const team = main.locator('section.cs').filter({ hasText: 'THE TEAM THAT MADE IT HAPPEN' });
		const names = await team.locator('p').allInnerTexts();
		const people = names.filter((n) => /^[A-Z][A-Z ]+$/.test(n.trim()) && !/PUBLICATIONS|CO-CREATIVE|CLICK/.test(n));
		expect(people[0]).toBe('LEANDER PORNEA');
		expect(people).toHaveLength(10);
		await expect(main.locator('a[href^="https://wdo.org/"]')).toHaveCount(1);
	});

	test('continues to /illustrations', async ({ page }) => {
		await page.goto('/widw');
		await page.getByRole('link', { name: 'CLICK ME TO CONTINUE' }).click();
		await expect(page).toHaveURL(/\/illustrations$/);
	});

	test('leftover Pip-Boy text hidden in the Canva page stays out', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/widw');
		await expect(page.locator('main')).not.toContainText('MULTIFUNCIONAL');
	});
});

test.describe('at the Canva width every frame keeps its Canva height', () => {
	for (const route of ['/', '/pipboy', '/widw', '/illustrations', '/ishda', '/yume']) {
		test(route, async ({ page }) => {
			test.skip(page.viewportSize()!.width !== 1366, 'measured at the Canva width');
			await page.goto(route);
			await page.evaluate(() => document.fonts.ready);
			const off = await page.evaluate(() =>
				[...document.querySelectorAll('main section.cs')]
					.map((s, i) => ({ i, canva: parseFloat(getComputedStyle(s).getPropertyValue('--h')), site: s.getBoundingClientRect().height }))
					.filter((r) => Math.abs(r.site - r.canva) > 2),
			);
			expect(off).toEqual([]);
			// Nothing spills past the last frame either: the page is as tall as the Canva export.
			const { page: height, frames } = await page.evaluate(() => ({
				// Pages without Canva continue links get a continue bar under the frames.
				page: document.documentElement.scrollHeight - (document.querySelector('nav.continue')?.getBoundingClientRect().height ?? 0),
				frames: [...document.querySelectorAll('main section.cs')].reduce((sum, s) => sum + parseFloat(getComputedStyle(s).getPropertyValue('--h')), 0),
			}));
			if (frames > 0) expect(Math.abs(height - (56 + frames))).toBeLessThanOrEqual(2);
		});
	}
});

test.describe('/ishda', () => {
	test('has its title, objective and timeline, and continues to /yume', async ({ page }) => {
		await page.goto('/ishda');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('ISHDA');
		const list = await headings(page);
		expect(inOrder(list, ['ISHDA', 'OBJECTIVE', 'CREATIVE & FUN PROGRESS']), list.join(' | ')).toBe(true);
		const main = page.locator('main');
		await expect(main).toContainText('start');
		await expect(main).toContainText('finish');
		// The closing banner belongs to the last page only.
		await expect(main).not.toContainText('THANK YOU');
		await page.getByRole('link', { name: 'CLICK ME TO CONTINUE' }).click();
		await expect(page).toHaveURL(/\/yume$/);
	});
});

test.describe('/yume', () => {
	test('ends the portfolio with the closing banner and no continue link', async ({ page }) => {
		await page.goto('/yume');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('YUMEPH');
		const list = await headings(page);
		expect(inOrder(list, ['YUMEPH', 'OUTCOME', 'THANK YOU :)', 'FOR TAKING TIME TO EXPLORE MY WORK!']), list.join(' | ')).toBe(true);
		await expect(page.getByRole('link', { name: 'CLICK ME TO CONTINUE' })).toHaveCount(0);
		// The banner is the last frame on the page.
		const last = page.locator('main section.cs').last();
		await expect(last).toContainText('THANK YOU :)');
		// Canva's giant decorative 3 sits under a white shape: nothing of it shows.
		await expect(page.locator('main .t.decor')).toHaveCount(0);
	});
});
