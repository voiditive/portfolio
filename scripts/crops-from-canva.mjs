// Build scripts/crops.json from the condensed Canva element data in design/canva/:
// one crop per image or video element, in 1x export coordinates (Canva y + 56 px
// header). Rotated elements use their axis-aligned bounding box, boxes are clipped
// to the page, and a crop that sits inside a bigger one is dropped (photo frames
// already contain their photo; the export is flattened).
// Run: node scripts/crops-from-canva.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HEADER = 56;
const PAGE_WIDTH = 1366;
const TOLERANCE = 2;
const PAGES = [
	['about-me', 1, 'home'],
	['pipboy', 2, 'pipboy'],
	['widw', 3, 'widw'],
	['illustrations', 4, 'illustrations'],
	['ishda', 5, 'ishda'],
	['yume', 6, 'yume'],
];
// Backgrounds that are not elements: a tile of the illustrations grid paper,
// taken from an empty stretch of page 4.
const EXTRAS = [{ page: 4, out: 'illustrations/grid-paper.webp', x: 0, y: 56 + 1536 + 240, w: 1366, h: 360 }];

const r1 = (n) => Math.round(n * 10) / 10;

export function boundingBox({ top, left, w, h, rot = 0 }) {
	const a = (rot * Math.PI) / 180;
	const bw = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
	const bh = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
	const cx = left + w / 2;
	const cy = top + h / 2;
	return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

export function clip(box, pageHeight) {
	const x = Math.max(0, box.x);
	const y = Math.max(0, box.y);
	return { x, y, w: Math.min(PAGE_WIDTH, box.x + box.w) - x, h: Math.min(pageHeight, box.y + box.h) - y };
}

export function contains(outer, inner) {
	return (
		inner.x >= outer.x - TOLERANCE &&
		inner.y >= outer.y - TOLERANCE &&
		inner.x + inner.w <= outer.x + outer.w + TOLERANCE &&
		inner.y + inner.h <= outer.y + outer.h + TOLERANCE
	);
}

export function dropContained(items) {
	const kept = [];
	for (const item of [...items].sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h)) {
		if (!kept.some((k) => contains(k.box, item.box))) kept.push(item);
	}
	return kept;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const entries = [];
	for (const [file, page, slug] of PAGES) {
		const data = JSON.parse(fs.readFileSync(`design/canva/${file}.json`, 'utf8'));
		const items = data.elements
			.filter((e) => e.media)
			.map((e) => ({ e, box: clip(boundingBox(e), data.height) }))
			.filter(({ box }) => box.w > 1 && box.h > 1);
		const kept = dropContained(items).sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
		kept.forEach(({ e, box }, i) => {
			entries.push({
				page,
				out: `${slug}/${String(i + 1).padStart(2, '0')}-${e.media.id}.webp`,
				x: r1(box.x),
				y: r1(box.y + HEADER),
				w: r1(box.w),
				h: r1(box.h),
				canvaId: e.id,
				kind: e.media.kind,
			});
		});
	}
	entries.push(...EXTRAS);
	fs.writeFileSync('scripts/crops.json', JSON.stringify(entries, null, '\t') + '\n');
	console.log(`${entries.length} crops`);
}
