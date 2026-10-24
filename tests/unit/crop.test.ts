import { describe, expect, test, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { cropOne } from '../../scripts/crop.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'crop-'));
const exportDir = path.join(tmp, 'export');
const outDir = path.join(tmp, 'out');

beforeAll(async () => {
	fs.mkdirSync(exportDir, { recursive: true });
	await sharp({ create: { width: 2732, height: 2000, channels: 3, background: '#df2200' } })
		.png()
		.toFile(path.join(exportDir, 'page-1.png'));
});

describe('cropOne', () => {
	test('doubles 1366-px Canva coordinates for the 2x export', async () => {
		const size = await cropOne({ page: 1, out: 't/a.webp', x: 100, y: 50, w: 300, h: 200 }, exportDir, outDir);
		expect(size).toEqual({ width: 600, height: 400 });
		expect(fs.existsSync(path.join(outDir, 't/a.webp'))).toBe(true);
	});

	test('clamps a box that runs past the export edge', async () => {
		const size = await cropOne({ page: 1, out: 't/edge.webp', x: 1300, y: 0, w: 100, h: 10 }, exportDir, outDir);
		expect(size).toEqual({ width: 132, height: 20 });
	});
});
