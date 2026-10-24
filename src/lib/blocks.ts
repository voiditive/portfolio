const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Block text → HTML. Markers: **bold**, ==accent==, [label](url); a url of "next"
 * means the next page. Returns null when a "next" link has nowhere to go.
 */
export function renderInline(text: string, options: { next?: string; external?: boolean } = {}): string | null {
	let missingNext = false;
	let html = escapeHtml(text)
		.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
		.replace(/==(.+?)==/gs, '<span class="accent">$1</span>')
		.replace(/\[(.+?)\]\((.+?)\)/gs, (_, label: string, url: string) => {
			let href = url;
			if (url === 'next') {
				if (!options.next) {
					missingNext = true;
					return label;
				}
				href = options.next;
			}
			const newTab = options.external && /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
			return `<a href="${href}"${newTab}>${label}</a>`;
		});
	return missingNext ? null : html;
}

/**
 * True when every line break in a Canva text box is an explicit one, so the web
 * font (a percent or two wider) must not add its own. Paragraphs Canva wrapped
 * itself are taller than their explicit lines.
 */
export function fitsWithoutWrapping(t: { text: string; h?: number; size: number; lh: number }): boolean {
	if (t.h === undefined) return false;
	const explicitLines = t.text.split('\n').length;
	return t.h < (explicitLines + 0.75) * t.size * Math.max(t.lh, 1);
}

/** Indexes of blocks in reading order for the stacked phone layout. */
export function phoneOrder(blocks: { x: number; y: number }[], rowTolerance = 12): number[] {
	return blocks
		.map((b, i) => ({ ...b, i }))
		.sort((a, b) => (Math.abs(a.y - b.y) <= rowTolerance ? a.x - b.x : a.y - b.y))
		.map((b) => b.i);
}

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * On phones text no longer sits on its Canva photo, only on the section colour,
 * so text that would vanish there switches to ink (or white on a dark section).
 */
export function phoneColor(color: string, background: string): string {
	if (contrast(color, background) >= 3) return color;
	return contrast('#1e1e1e', background) >= contrast('#ffffff', background) ? '#1e1e1e' : '#ffffff';
}
