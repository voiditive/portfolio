import { describe, expect, test } from 'vitest';
import { canvaFit, fitsWithoutWrapping, webWeight, phoneColor, phoneOrder, renderInline } from '../../src/lib/blocks';

describe('renderInline', () => {
	test('turns markers into bold, accent and links, escaping HTML', () => {
		expect(renderInline('==I’M== ANDREW <3 **bold** [CV](https://x.test/a?b=1&c=2)')).toBe(
			'<span class="accent">I’M</span> ANDREW &lt;3 <strong>bold</strong> <a href="https://x.test/a?b=1&amp;c=2">CV</a>',
		);
	});

	test('"next" links go to the next page', () => {
		expect(renderInline('[CLICK ME TO CONTINUE](next)', { next: '/widw' })).toBe('<a href="/widw">CLICK ME TO CONTINUE</a>');
	});

	test('a "next" link with nowhere to go returns null so the block can be left out', () => {
		expect(renderInline('[CLICK ME TO CONTINUE](next)', {})).toBeNull();
	});

	test('external links open in a new tab', () => {
		expect(renderInline('[WDO](https://wdo.org)', { external: true })).toBe(
			'<a href="https://wdo.org" target="_blank" rel="noopener">WDO</a>',
		);
	});
});

describe('phoneOrder', () => {
	test('reads top to bottom, then left to right within a row', () => {
		const blocks = [
			{ x: 700, y: 300 },
			{ x: 100, y: 304 },
			{ x: 400, y: 50 },
		];
		expect(phoneOrder(blocks)).toEqual([2, 1, 0]);
	});
});

describe('phoneColor', () => {
	test('keeps a colour that reads on the section background', () => {
		expect(phoneColor('#ffffff', '#df2200')).toBe('#ffffff');
		expect(phoneColor('#1e1e1e', '#ffffff')).toBe('#1e1e1e');
	});

	test('swaps white text that sat on a photo for ink on a white section', () => {
		expect(phoneColor('#ffffff', '#ffffff')).toBe('#1e1e1e');
		expect(phoneColor('#f4eadf', '#fafafa')).toBe('#1e1e1e');
	});
});

describe('fitsWithoutWrapping', () => {
	test('a one-line Canva box keeps its line, even if the web font is a little wider', () => {
		expect(fitsWithoutWrapping({ text: 'PORTFOLIO', h: 194.2, size: 161.9, lh: 0.8 })).toBe(true);
		expect(fitsWithoutWrapping({ text: 'THE PROCESSES\nOVER THE PAST\nYEARS', h: 61.6, size: 19.9, lh: 0.8 })).toBe(true);
	});

	test('a paragraph Canva wrapped itself wraps again', () => {
		expect(fitsWithoutWrapping({ text: 'I’m 21 years old, currently studying Industrial Design', h: 173.3, size: 17, lh: 1.4 })).toBe(false);
	});

	test('without a Canva height, text wraps', () => {
		expect(fitsWithoutWrapping({ text: 'NEW', size: 20, lh: 1 })).toBe(false);
	});
});

describe('canvaFit', () => {
	// Measured on the Canva export of the home page: Canva puts the first baseline at a
	// fixed depth below the box top whatever the line height, and its headline font has
	// capitals 1.146x taller than Adobe's Futura PT at the same width.
	test('Futura PT is drawn 1.146x taller and squeezed back to its width', () => {
		expect(canvaFit('futura', 0.8).k).toBeCloseTo(1.146, 3);
		expect(canvaFit('arimo', 0.8).k).toBe(1);
		expect(canvaFit('montserrat', 1.2).k).toBe(1);
	});

	test('shifts text down so its first baseline sits where Canva drew it', () => {
		// PORTFOLIO (futura, line height 0.8): baseline 0.938em below the box top in
		// Canva; drawn 1.146x with ascent 0.96 and descent 0.27 it lands at 0.795em.
		expect(canvaFit('futura', 0.8).dy).toBeCloseTo(0.143, 2);
		// MY DESIGN PROCESS (arimo, 0.8): 0.827em in Canva, 0.749em on the web.
		expect(canvaFit('arimo', 0.8).dy).toBeCloseTo(0.078, 2);
		// EDUCATION (montserrat, 1): 0.92em in Canva, 0.859em on the web.
		expect(canvaFit('montserrat', 1).dy).toBeCloseTo(0.061, 2);
	});

	test('a taller line height moves web text down, so the shift shrinks', () => {
		expect(canvaFit('arimo', 1.4).dy).toBeCloseTo(canvaFit('arimo', 0.8).dy - 0.3, 5);
	});
});

describe('canvaFit widths', () => {
	// Canva's regular Futura is 8% wider than Futura PT Book; its Bold 2% narrower than Demi.
	test("Futura PT is stretched to Canva's width per weight", () => {
		expect(canvaFit('futura', 1, 400).sx).toBeCloseTo(1.08, 2);
		expect(canvaFit('futura', 1, 700).sx).toBeCloseTo(0.98, 2);
		// Extra Bold words run 0.5–5.5% narrow (PROBLEM, PIP-BOY 3000 … OUTCOME, MY ROLE): split it.
		expect(canvaFit('futura', 1, 800).sx).toBeCloseTo(1.03, 2);
	});

	test('Arimo and Montserrat keep their width', () => {
		expect(canvaFit('arimo', 1, 400).sx).toBe(1);
		expect(canvaFit('montserrat', 1, 700).sx).toBe(1);
	});
});

describe('webWeight', () => {
	test("Canva's Futura Bold is Futura PT Demi; Book and Extra Bold keep their weight", () => {
		expect(webWeight('futura', 400)).toBe(400);
		expect(webWeight('futura', 700)).toBe(600);
		expect(webWeight('futura', 800)).toBe(800);
	});

	test("other fonts keep Canva's weight", () => {
		expect(webWeight('arimo', 700)).toBe(700);
		expect(webWeight('montserrat', 700)).toBe(700);
	});
});
