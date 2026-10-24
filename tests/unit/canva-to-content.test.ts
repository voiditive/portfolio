import { describe, expect, test } from 'vitest';
import { fontKey, linkFor, mapLink, runsToText } from '../../scripts/canva-to-content.mjs';

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
