import { describe, expect, test, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { decorLayer } from '../../scripts/decor-layers.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'decor-'));
const exportPath = path.join(tmp, 'page-1.png');

beforeAll(async () => {
	// A 2x export: 56 px header, then two 768 px sections, all green.
	await sharp({ create: { width: 2732, height: (56 + 768 * 2) * 2, channels: 3, background: '#00aa00' } })
		.png()
		.toFile(exportPath);
});

async function pixel(buffer: Buffer, x: number, y: number) {
	const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
	const i = (y * info.width + x) * info.channels;
	return [data[i], data[i + 1], data[i + 2]];
}

// WebP is lossy, so colours are compared within a few levels.
const near = (actual: number[], expected: number[]) =>
	expect(actual.every((v, i) => Math.abs(v - expected[i]) <= 3), `${actual} vs ${expected}`).toBe(true);

describe('decorLayer', () => {
	test('cuts one section and paints media boxes with the section fill', async () => {
		const out = await decorLayer({
			exportPath,
			sectionTop: 768,
			sectionHeight: 768,
			boxes: [{ x: 100, y: 868, w: 200, h: 100 }],
			fill: '#ffffff',
		});
		const meta = await sharp(out).metadata();
		expect([meta.width, meta.height]).toEqual([2732, 1536]);
		near(await pixel(out, 400, 300), [255, 255, 255]);
		near(await pixel(out, 1000, 1000), [0, 170, 0]);
	});

	test('clips a box that starts in the previous section', async () => {
		const out = await decorLayer({
			exportPath,
			sectionTop: 768,
			sectionHeight: 768,
			boxes: [{ x: 0, y: 700, w: 50, h: 100 }],
			fill: '#ffffff',
		});
		near(await pixel(out, 10, 10), [255, 255, 255]);
		near(await pixel(out, 10, 100), [0, 170, 0]);
	});

	test('ignores a box that overlaps the section by less than half a pixel', async () => {
		const out = await decorLayer({
			exportPath,
			sectionTop: 768,
			sectionHeight: 768,
			boxes: [{ x: 0, y: 700, w: 50, h: 68.2 }],
			fill: '#ffffff',
		});
		near(await pixel(out, 10, 0), [0, 170, 0]);
	});
});
