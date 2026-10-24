// Cut images out of the 2x text-free Canva exports (canva-export/clean/page-N.png).
// crops.json boxes are in 1x export coordinates: Canva coordinates with the
// 56 px Canva website header added to y. Run: node scripts/crop.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SCALE = 2;

/**
 * @param {{ page: number, out: string, x: number, y: number, w: number, h: number }} entry
 * @param {string} exportDir
 * @param {string} outDir
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function cropOne(entry, exportDir, outDir) {
	const source = sharp(path.join(exportDir, `page-${entry.page}.png`), { limitInputPixels: false });
	const meta = await source.metadata();
	const left = Math.max(0, Math.round(entry.x * SCALE));
	const top = Math.max(0, Math.round(entry.y * SCALE));
	const width = Math.min(meta.width - left, Math.round(entry.w * SCALE));
	const height = Math.min(meta.height - top, Math.round(entry.h * SCALE));
	const target = path.join(outDir, entry.out);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	await source.extract({ left, top, width, height }).webp({ quality: 85 }).toFile(target);
	return { width, height };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	const entries = JSON.parse(fs.readFileSync(path.join(root, 'scripts/crops.json'), 'utf8'));
	for (const entry of entries) {
		await cropOne(entry, path.join(root, 'canva-export/clean'), path.join(root, 'src/assets/images'));
	}
	console.log(`cropped ${entries.length} images`);
}
