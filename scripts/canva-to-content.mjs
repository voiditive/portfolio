// Turn the condensed Canva element data (design/canva/*.json) and the crop list
// (scripts/crops.json) into the site's content files: one list of sections per
// page, each holding text and image blocks with their Canva boxes.
// Run once after cropping: node scripts/canva-to-content.mjs
// It overwrites src/content/, so edits made since (by hand or in Pages CMS) are lost.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const HEADER = 56;
const FONTS = {
	YAFcfgcNhWk: 'spartan',
	YAFcf7zkXN0: 'arimo',
	YAFanRK9Tic: 'arimo',
	YAFancOAWqc: 'arimo',
	YAFdtQi73Xs: 'montserrat',
};
const WEIGHTS = { normal: 400, bold: 700, ultrabold: 800 };

export function fontKey(ref) {
	return FONTS[ref.split(',')[0]] ?? 'spartan';
}

/** Canva links between website pages become "next" (resolved at build) or #top. */
export function mapLink(link, text) {
	if (!link.startsWith('#page-')) return link;
	return /back up/i.test(text) ? '#top' : 'next';
}

/** The value of the key covering the most characters across runs. */
function dominant(runs, key) {
	const counts = new Map();
	for (const r of runs) counts.set(r[key], (counts.get(r[key]) ?? 0) + r.text.trim().length);
	return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Styled Canva runs → one string with **bold**, ==accent== and [link](url) markers. */
export function runsToText(runs) {
	const visible = runs.filter((r) => r.text.trim());
	const weights = visible.map((r) => r.weight);
	const weight = weights.includes('normal') ? 'normal' : (weights[0] ?? runs[0].weight);
	const color = dominant(visible, 'color');
	let text = '';
	for (const r of runs) {
		let piece = r.text;
		const core = piece.trim();
		if (core) {
			const start = piece.indexOf(core);
			let inner = core;
			if (r.link) inner = `[${inner}](${mapLink(r.link, core)})`;
			if (r.weight !== weight && r.weight !== 'normal') inner = `**${inner}**`;
			if (r.color !== color) inner = `==${inner}==`;
			piece = piece.slice(0, start) + inner + piece.slice(start + core.length);
		}
		text += piece;
	}
	return { text: text.replace(/\n+$/, '').replace(/\*\*\*\*/g, ''), weight, color };
}

const r1 = (n) => Math.round(n * 10) / 10;
const oneLine = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 48);

const PAGES = [
	{ file: 'about-me', page: 1, slug: 'home', alt: 'Portfolio' },
	{ file: 'pipboy', page: 2, slug: 'pipboy', alt: 'Pip-Boy multifunctional clock' },
	{ file: 'widw', page: 3, slug: 'widw', alt: 'World Industrial Design Week 2026' },
	{ file: 'illustrations', page: 4, slug: 'illustrations', alt: 'Illustration' },
	{ file: 'ishda', page: 5, slug: 'ishda', alt: 'ISHDA utensil packaging' },
	{ file: 'yume', page: 6, slug: 'yume', alt: 'YumePH clothing' },
];

// Home page cards: Canva did not link them, the site does.
// Leftover copies of the Pip-Boy cover text on the WIDW page, white on white in Canva:
// invisible there, but phones recolour text for contrast and would show them.
const HIDDEN_IDS = new Set(['LBY33RmZksky0kyv', 'LBQVJYCNlvRTBKt0', 'LBySB7DsFpsdQ5Gg', 'LBSDWWRYLGhXSLRD']);

const LINKS_BY_ID = {
	LB2NDGQMDsBH8jZM: '/pipboy',
	LBKcsXtCrNNhLrfq: '/widw',
	LBPJQT9GycFGfL5f: '/yume',
	LBhSyCV3hnLfZw20: '/ishda',
};
const HOME_LINKS_BY_TEXT = {
	PIPBOY: '/pipboy',
	'WIDW-WIDO': '/widw',
	YUMEPH: '/yume',
	ISHDA: '/ishda',
};
const LINKS_BY_TEXT = {
	'+63 939 357 3880': 'tel:+639393573880',
	'uy.andreuy@gmail.com': 'mailto:uy.andreuy@gmail.com',
};

export function linkFor(text, slug) {
	// Canva wraps some card names: "WIDW-\nWIDO".
	const key = text.replace(/-\s+/g, '-').replace(/\s+/g, ' ').trim();
	return LINKS_BY_TEXT[key] ?? (slug === 'home' ? HOME_LINKS_BY_TEXT[key] : undefined);
}

const PROJECTS = {
	pipboy: { number: 1, order: 1, navLabel: 'pipboy', title: 'PIP-BOY MULTIFUNCTIONAL CLOCK', cardTitle: 'PIPBOY', designDate: 'DESIGN DATE: 2026' },
	widw: { number: 2, order: 2, navLabel: 'widw', title: 'WORLD INDUSTRIAL DESIGN WEEK 2026', cardTitle: 'WIDW-WIDO', designDate: 'DESIGN DATE: 2026' },
	yume: { number: 3, order: 5, navLabel: 'yume', title: 'YUMEPH CLOTHING BRAND', cardTitle: 'YUMEPH', designDate: 'DESIGN DATE: 2020-2022' },
	ishda: { number: 4, order: 4, navLabel: 'ishda', title: 'ISHDA: ARTISAN UTENSIL PACKAGING', cardTitle: 'ISHDA', designDate: 'DESIGN DATE: 2025' },
};
const CARD_IDS = { pipboy: 'LB2NDGQMDsBH8jZM', widw: 'LBKcsXtCrNNhLrfq', yume: 'LBPJQT9GycFGfL5f', ishda: 'LBhSyCV3hnLfZw20' };

/**
 * Heading tags for a page's text blocks ({ text, size, y, decor }). Big (34 px+) all-caps
 * titles are headings; lowercase labels ("start", "finish"), symbols and decorative
 * glyphs are not. The h1 is the first title on a case study, the largest on the home page.
 */
export function headingTags(blocks, h1 = 'first') {
	const isTitle = (b) => !b.decor && b.size >= 34 && /[A-Z]/.test(b.text) && b.text === b.text.toUpperCase();
	const titles = blocks.map((b, i) => ({ ...b, i })).filter(isTitle);
	const pick = h1 === 'largest' ? [...titles].sort((a, b) => b.size - a.size)[0] : [...titles].sort((a, b) => a.y - b.y)[0];
	return blocks.map((b, i) => (i === pick?.i ? 'h1' : isTitle(b) ? 'h2' : 'p'));
}

function buildSections(data, crops, alt, slug) {
	const textEls = data.elements.filter((e) => e.runs && e.runs.some((r) => r.text.trim()) && !HIDDEN_IDS.has(e.id));
	const tags = headingTags(
		textEls.map((e) => {
			const size = r1(Math.max(...e.runs.map((r) => r.size ?? 0)));
			return { text: runsToText(e.runs).text.replace(/\*\*|==|\[|\]\([^)]*\)/g, ''), size, y: e.top, decor: size > 400 };
		}),
		slug === 'home' ? 'largest' : 'first',
	);
	const tagById = new Map(textEls.map((e, i) => [e.id, tags[i]]));
	const order = new Map(data.elements.map((e, i) => [e.id, i]));
	const cropById = new Map(crops.map((c) => [c.canvaId, c]));
	let imageCount = 0;
	const sections = data.sections.map((s, i) => ({
		background: `../../assets/images/${slug}/decor-${String(i + 1).padStart(2, '0')}.webp`,
		color: s.bg ?? '#ffffff',
		height: s.h,
		blocks: [],
	}));
	const sectionOf = (top) => {
		const i = data.sections.findIndex((s) => top >= s.top && top < s.top + s.h);
		if (i !== -1) return i;
		return top < 0 ? 0 : data.sections.length - 1;
	};
	const items = [];
	for (const e of data.elements) {
		if (HIDDEN_IDS.has(e.id)) continue;
		if (e.runs && e.runs.some((r) => r.text.trim())) items.push({ e, kind: 'text' });
		else if (e.media && cropById.has(e.id)) items.push({ e, kind: e.media.kind === 'video' ? 'video' : 'image' });
	}
	items.sort((a, b) => order.get(a.e.id) - order.get(b.e.id));
	for (const { e, kind } of items) {
		if (kind === 'text') {
			const { text, weight, color } = runsToText(e.runs);
			const first = e.runs.find((r) => r.text.trim());
			const size = r1(Math.max(...e.runs.map((r) => r.size ?? 0)));
			const decor = size > 400;
			// A giant decorative glyph belongs to the frame its middle is in, where it shows.
			const section = sectionOf(decor ? e.top + e.h / 2 : e.top);
			const as = tagById.get(e.id);
			const block = {
				kind: 'text',
				label: oneLine(text.replace(/\*\*|==|\[|\]\([^)]*\)/g, '')),
				text,
				as,
				x: r1(e.left),
				y: r1(e.top - data.sections[section].top),
				w: r1(e.w),
				h: r1(e.h),
				...(e.rot ? { rot: r1(e.rot) } : {}),
				style: {
					font: fontKey(first.font),
					size,
					weight: WEIGHTS[weight] ?? 400,
					color,
					align: first.align ?? 'start',
					lh: first.lh ?? 1.2,
					ls: first.ls ?? 0,
				},
				...(decor ? { decor: true } : {}),
			};
			const link = linkFor(text, slug);
			if (link) block.link = link;
			sections[section].blocks.push(block);
		} else {
			const crop = cropById.get(e.id);
			const top = crop.y - HEADER;
			const section = sectionOf(top);
			const small = crop.w < 40 || crop.h < 40;
			if (!small) imageCount += 1;
			sections[section].blocks.push({
				kind,
				label: small ? 'Decoration' : `Image ${imageCount}`,
				image: `../../assets/images/${crop.out}`,
				alt: small ? '' : `${alt} – image ${imageCount}`,
				x: crop.x,
				y: r1(top - data.sections[section].top),
				w: crop.w,
				h: crop.h,
				...(small ? { decor: true } : {}),
				...(LINKS_BY_ID[e.id] ? { link: LINKS_BY_ID[e.id] } : {}),
			});
		}
	}
	return sections;
}

function write(file, body) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, body);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	const crops = JSON.parse(fs.readFileSync(path.join(root, 'scripts/crops.json'), 'utf8'));
	const yaml = (obj) => YAML.stringify(obj, { lineWidth: 0 });
	const cardCrop = (slug) => crops.find((c) => c.canvaId === CARD_IDS[slug]).out;
	for (const p of PAGES) {
		const data = JSON.parse(fs.readFileSync(path.join(root, `design/canva/${p.file}.json`), 'utf8'));
		const pageCrops = crops.filter((c) => c.page === p.page && c.canvaId);
		const sections = buildSections(data, pageCrops, p.alt, p.slug);
		if (p.slug === 'home') {
			// The second Canva frame is "about me": the nav links to /#about.
			sections[1] = { anchor: 'about', ...sections[1] };
			const site = {
				name: 'Andrew Matthew Uy',
				email: 'uy.andreuy@gmail.com',
				phone: '+63 939 357 3880',
				cvUrl: 'https://drive.google.com/file/d/17BG8bozSRukMAXM4ZNurV2sGvoGaW5i2/view?usp=sharing',
				sections,
			};
			write(path.join(root, 'src/content/site/site.yaml'), yaml(site));
		} else if (p.slug === 'illustrations') {
			write(path.join(root, 'src/content/illustrations/illustrations.yaml'), yaml({ navLabel: 'illustrations', order: 3, sections }));
		} else {
			const front = { ...PROJECTS[p.slug], cardImage: `../../assets/images/${cardCrop(p.slug)}`, sections };
			write(path.join(root, `src/content/projects/${p.slug}.md`), `---\n${yaml(front)}---\n`);
		}
		const blocks = sections.reduce((n, s) => n + s.blocks.length, 0);
		console.log(p.slug, sections.length, 'sections', blocks, 'blocks');
	}
}
