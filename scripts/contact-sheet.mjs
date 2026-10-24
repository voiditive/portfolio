// Contact sheet of every image in a folder, for reviewing crops. Run: node scripts/contact-sheet.mjs <dir> <out.png>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const [, , dir, out] = process.argv;
const files = fs.readdirSync(dir).sort();
const cell = 220, cols = 6, labelH = 22;
const rows = Math.ceil(files.length / cols);
const layers = [];
for (const [i, f] of files.entries()) {
	const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + labelH);
	const img = await sharp(path.join(dir, f)).resize(cell - 10, cell - 10, { fit: 'inside', background: '#888' }).png().toBuffer();
	layers.push({ input: img, left: x + 5, top: y + labelH });
	layers.push({ input: Buffer.from(`<svg width="${cell}" height="${labelH}"><text x="4" y="16" font-size="13" font-family="Arial">${f.slice(0, 26)}</text></svg>`), left: x, top: y });
}
await sharp({ create: { width: cols * cell, height: rows * (cell + labelH), channels: 3, background: '#9a9a9a' } }).composite(layers).png().toFile(out);
