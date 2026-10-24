import { describe, expect, test } from 'vitest';
import { fontKey, headingTags, splitClosing, linkFor, mapLink, runsToText } from '../../scripts/canva-to-content.mjs';

const run = (text: string, extra: Record<string, unknown> = {}) => ({
	text,
	size: 20,
	weight: 'normal',
	color: '#1e1e1e',
	font: 'YAFcfgcNhWk,3',
	...extra,
});

describe('runsToText', () => {
	test('a single run keeps its text and weight', () => {
		expect(runsToText([run('PROBLEM', { weight: 'bold' })])).toEqual({ text: 'PROBLEM', weight: 'bold', color: '#1e1e1e' });
	});

	test('bold runs inside normal text become **bold**', () => {
		expect(runsToText([run('THE PROCESSES OVER THE PAST '), run('YEARS', { weight: 'bold' })]).text).toBe(
			'THE PROCESSES OVER THE PAST **YEARS**',
		);
	});

	test('a run in another colour becomes ==accent==, base colour is the most used one', () => {
		const result = runsToText([run('I’M', { color: '#df2200' }), run(' ANDREW'), run(' UY')]);
		expect(result.text).toBe('==I’M== ANDREW UY');
		expect(result.color).toBe('#1e1e1e');
	});

	test('linked runs become markdown links and trailing newlines are dropped', () => {
		expect(runsToText([run('LEARN MORE HERE', { link: 'https://drive.google.com/x' }), run('\n')]).text).toBe(
			'[LEARN MORE HERE](https://drive.google.com/x)',
		);
	});
});

describe('mapLink', () => {
	test('Canva page anchors become "next", or #top for go-back-up links', () => {
		expect(mapLink('#page-2', 'CLICK ME TO CONTINUE')).toBe('next');
		expect(mapLink('#page-0', 'CLICK TO GO BACK UP')).toBe('#top');
		expect(mapLink('https://wdo.org/x', 'World Design Organization')).toBe('https://wdo.org/x');
	});
});

describe('fontKey', () => {
	test('maps Canva font refs to the three web fonts', () => {
		expect(fontKey('YAFcfgcNhWk,3')).toBe('spartan');
		expect(fontKey('YAFcf7zkXN0,0')).toBe('arimo');
		expect(fontKey('YAFanRK9Tic,0')).toBe('arimo');
		expect(fontKey('YAFdtQi73Xs,0')).toBe('montserrat');
		expect(fontKey('YAFancOAWqc,0')).toBe('arimo');
	});
});

describe('linkFor', () => {
	test('card names link to their projects only on the home page', () => {
		expect(linkFor('PIPBOY', 'home')).toBe('/pipboy');
		expect(linkFor('PIPBOY', 'pipboy')).toBeUndefined();
		expect(linkFor('WIDW-\nWIDO', 'home')).toBe('/widw');
	});

	test('phone and email link everywhere', () => {
		expect(linkFor('uy.andreuy@gmail.com', 'yume')).toBe('mailto:uy.andreuy@gmail.com');
		expect(linkFor('+63 939 357 3880', 'home')).toBe('tel:+639393573880');
	});
});

describe('runsToText base colour', () => {
	test('is the colour covering the most text, so a short red word becomes the accent', () => {
		const result = runsToText([run('I’M', { color: '#df2200' }), run(' ANDREW')]);
		expect(result.color).toBe('#1e1e1e');
		expect(result.text).toBe('==I’M== ANDREW');
	});
});

describe('headingTags', () => {
	const t = (text: string, size: number, y: number, decor = false) => ({ text, size, y, decor });
	const page = [t('PROBLEM', 99.8, 2078), t('PIP-BOY 3000', 83.7, 914), t('start', 60.7, 3201), t('+', 86.3, 700), t('Body text', 17, 950)];

	test('on a case study the first big title is the h1, later big titles are h2', () => {
		expect(headingTags(page, 'first')).toEqual(['h2', 'h1', 'p', 'p', 'p']);
	});

	test('on the home page the largest title is the h1', () => {
		expect(headingTags([t('MY INDUSTRIAL DESIGN', 59.3, 128), t('PORTFOLIO', 161.9, 163)], 'largest')).toEqual(['h2', 'h1']);
	});

	test('lowercase labels, symbols and decorative giant glyphs are never headings', () => {
		expect(headingTags([t('sample videos', 57.5, 10), t('+', 86.3, 20), t('A', 900, 0, true), t('MY ROLE', 91, 30)], 'first')).toEqual(['p', 'p', 'p', 'h1']);
	});
});

describe('splitClosing', () => {
	test('the frame that thanks the reader leaves the page and becomes the site closing banner', () => {
		const frame = (text: string) => ({ blocks: [{ kind: 'text', text }] });
		const { sections, closing } = splitClosing([frame('YUMEPH'), frame('OUTCOME'), frame('THANK YOU :)')]);
		expect(sections.map((s) => s.blocks[0].text)).toEqual(['YUMEPH', 'OUTCOME']);
		expect(closing?.blocks[0].text).toBe('THANK YOU :)');
	});

	test('pages without one keep every frame', () => {
		const { sections, closing } = splitClosing([{ blocks: [{ kind: 'text', text: 'ISHDA' }] }]);
		expect(sections).toHaveLength(1);
		expect(closing).toBeUndefined();
	});
});
