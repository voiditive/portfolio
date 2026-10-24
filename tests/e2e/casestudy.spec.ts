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
