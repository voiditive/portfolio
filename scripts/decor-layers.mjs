// Cut one background image per Canva section from the text-free exports
// (canva-export/clean/page-N.png): lines, scribbles, connectors and textures stay,
// and every image or video box is painted with the section colour, since the site
// places the real images on top. Run: node scripts/decor-layers.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { boundingBox } from './crops-from-canva.mjs';

const SCALE = 2;
const HEADER = 56;
const WIDTH = 1366;

/**
 * @param {{ exportPath: string, sectionTop: number, sectionHeight: number,
 *   boxes: { x: number, y: number, w: number, h: number }[], fill: string }} options
 *   Coordinates are Canva page coordinates (no header).
 * @returns {Promise<Buffer>} a WebP of the section at 2x
 */
export async function decorLayer({ exportPath, sectionTop, sectionHeight, boxes, fill }) {
	const masks = [];
	for (const box of boxes) {
		const top = Math.max(0, box.y - sectionTop);
		const bottom = Math.min(sectionHeight, box.y + box.h - sectionTop);
		const left = Math.max(0, box.x);
		const right = Math.min(WIDTH, box.x + box.w);
		const width = Math.round((right - left) * SCALE);
		const height = Math.round((bottom - top) * SCALE);
		if (width < 1 || height < 1) continue;
		masks.push({
			input: { create: { width, height, channels: 3, background: fill } },
			left: Math.round(left * SCALE),
			top: Math.round(top * SCALE),
		});
	}
	return sharp(exportPath, { limitInputPixels: false })
		.extract({ left: 0, top: (HEADER + sectionTop) * SCALE, width: WIDTH * SCALE, height: sectionHeight * SCALE })
		.composite(masks)
		.webp({ quality: 80 })
		.toBuffer();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	const pages = [
		['about-me', 1, 'home'],
		['pipboy', 2, 'pipboy'],
		['widw', 3, 'widw'],
		['illustrations', 4, 'illustrations'],
		['ishda', 5, 'ishda'],
		['yume', 6, 'yume'],
	];
	let count = 0;
	for (const [file, page, slug] of pages) {
		const data = JSON.parse(fs.readFileSync(path.join(root, `design/canva/${file}.json`), 'utf8'));
		const boxes = data.elements.filter((e) => e.media).map(boundingBox);
		for (const [i, section] of data.sections.entries()) {
			const out = await decorLayer({
				exportPath: path.join(root, `canva-export/clean/page-${page}.png`),
				sectionTop: section.top,
				sectionHeight: section.h,
				boxes,
				fill: section.bg ?? '#ffffff',
			});
			fs.writeFileSync(path.join(root, `src/assets/images/${slug}/decor-${String(i + 1).padStart(2, '0')}.webp`), out);
			count++;
		}
	}
	console.log(`wrote ${count} decor layers`);
}
