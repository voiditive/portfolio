// Overlay a page of the site on its Canva export to check pixel fidelity.
// Needs the site running (npm run dev or npm run preview).
// Run: node scripts/compare.mjs <page name> <canva page number>   e.g. node scripts/compare.mjs pipboy 2
// (names, not routes: Git Bash rewrites a leading / into a Windows path; use index for /).
// Writes compare/<name>.png: the Canva page underneath, the site at 50 % on top,
// and compare/<name>-side.png with the two side by side.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const WIDTH = 1366;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [name = 'index', page = '1'] = process.argv.slice(2);
const route = name === 'index' ? '/' : `/${name}`;
const baseUrl = process.env.BASE_URL ?? 'http://localhost:4321';

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: WIDTH, height: 768 } });
await tab.goto(new URL(route, baseUrl).href, { waitUntil: 'networkidle' });
await tab.evaluate(() => document.fonts.ready);
const shot = await tab.screenshot({ fullPage: true });
await browser.close();

const canva = await sharp(path.join(root, `canva-export/page-${page}.png`), { limitInputPixels: false })
	.resize({ width: WIDTH })
	.png()
	.toBuffer({ resolveWithObject: true });
const site = await sharp(shot).metadata();
const height = Math.max(canva.info.height, site.height);
const faded = await sharp(shot).ensureAlpha(0.5).png().toBuffer();

fs.mkdirSync(path.join(root, 'compare'), { recursive: true });
await sharp({ create: { width: WIDTH, height, channels: 4, background: '#ffffff' } })
	.composite([
		{ input: canva.data, top: 0, left: 0 },
		{ input: faded, top: 0, left: 0 },
	])
	.png()
	.toFile(path.join(root, `compare/${name}.png`));
await sharp({ create: { width: WIDTH * 2, height, channels: 4, background: '#ffffff' } })
	.composite([
		{ input: canva.data, top: 0, left: 0 },
		{ input: shot, top: 0, left: WIDTH },
	])
	.png()
	.toFile(path.join(root, `compare/${name}-side.png`));
console.log(`compare/${name}.png (canva ${canva.info.height}px, site ${site.height}px)`);
