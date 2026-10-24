// Condense a Canva read-design dump into one flat element list per website page,
// with each element's top converted to the page's absolute (1x) coordinate.
import fs from 'node:fs';
const [, , src, outDir] = process.argv;
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const pages = raw.design_content?.pages ?? raw.pages;
const r = (n) => Math.round(n * 10) / 10;
for (const page of pages) {
	const subs = page.pages ?? [page];
	let offset = 0;
	const els = [];
	const sections = [];
	const walk = (list, dy, dx) => {
		for (const e of list) {
			const base = { id: e.id, type: e.type, top: r(e.top + dy), left: r(e.left + dx), w: r(e.width), h: r(e.height) };
			if (e.rotation) base.rot = r(e.rotation);
			if (e.opacity !== undefined && e.opacity !== 1) base.opacity = e.opacity;
			if (e.type === 'text') {
				base.runs = (e.textRegions ?? []).map((t) => {
					const f = t.formatting ?? {};
					return { text: t.characters, size: f.fontSize && r(f.fontSize), weight: f.fontWeight, style: f.fontStyle === 'normal' ? undefined : f.fontStyle, color: f.color, align: f.textAlign, lh: f.lineHeight, ls: f.letterSpacing, font: f.fontRef, link: f.link || undefined, deco: f.decoration === 'none' ? undefined : f.decoration };
				});
			}
			// Images and videos fill rects directly, or the first path of a shape (photo frames).
			const media = e.fill?.media ?? e.paths?.find((p) => p.fill?.media)?.fill.media;
			if (media) base.media = { kind: media.type, id: media.mediaId ?? media.videoId, recolor: media.recoloring };
			else if (e.fill?.color) base.fill = e.fill.color.color;
			if (e.stroke?.weight) base.stroke = { w: e.stroke.weight, color: e.stroke.color?.color };
			if (e.type === 'group' && e.children) { els.push({ ...base, group: true, children: e.children.length }); walk(e.children, dy, dx); continue; }
			els.push(base);
		}
	};
	for (const s of subs) {
		sections.push({ id: s.id, top: offset, h: s.dimensions.height, bg: s.background?.color?.color, bgMedia: s.background?.media?.mediaId });
		walk(s.elements ?? [], offset, 0);
		offset += s.dimensions.height;
	}
	const out = { title: page.title, height: offset, sections, elements: els };
	fs.writeFileSync(`${outDir}/${(page.title || page.id).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`, JSON.stringify(out, null, 1));
	console.log(page.title, 'height', offset, 'sections', sections.length, 'elements', els.length);
}
