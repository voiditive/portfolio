import type { Page } from '@playwright/test';
import sharp from 'sharp';

/**
 * Extent of text ink in a clip of the page: rows with at least `min` ink pixels, and
 * the columns they cover. Ink is white text, or dark text with `dark: true`.
 */
export async function ink(page: Page, clip: { x: number; y: number; width: number; height: number }, { min = 300, dark = false } = {}) {
	const png = await page.screenshot({ clip, fullPage: true });
	const { data, info } = await sharp(png).resize({ width: clip.width }).raw().toBuffer({ resolveWithObject: true });
	const isInk = (r: number, g: number, b: number) => (dark ? r < 90 && g < 90 && b < 90 : r > 235 && g > 235 && b > 235);
	const rows: number[] = [];
	let left = Infinity;
	let right = -Infinity;
	for (let y = 0; y < info.height; y++) {
		const xs: number[] = [];
		for (let x = 0; x < info.width; x++) {
			const i = (y * info.width + x) * info.channels;
			if (isInk(data[i], data[i + 1], data[i + 2])) xs.push(x);
		}
		if (xs.length < min) continue;
		rows.push(clip.y + y);
		left = Math.min(left, clip.x + xs[0]);
		right = Math.max(right, clip.x + xs.at(-1)!);
	}
	return { top: rows[0], bottom: rows.at(-1), left, right };
}
