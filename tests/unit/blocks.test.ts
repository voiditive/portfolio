import { describe, expect, test } from 'vitest';
import { canvaFit, fitsWithoutWrapping, phoneColor, phoneOrder, renderInline } from '../../src/lib/blocks';

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
	// capitals about 1.1x taller than League Spartan at the same width.
	test('League Spartan is drawn 1.1x taller and squeezed back to its width', () => {
		expect(canvaFit('spartan', 0.8).k).toBeCloseTo(1.1, 2);
		expect(canvaFit('arimo', 0.8).k).toBe(1);
		expect(canvaFit('montserrat', 1.2).k).toBe(1);
	});

	test('shifts text down so its first baseline sits where Canva drew it', () => {
		// PORTFOLIO (spartan, line height 0.8): baseline 0.918em below the box top in
		// Canva, 0.638em on the web before the fit.
		expect(canvaFit('spartan', 0.8).dy).toBeCloseTo(0.918 - 0.638 - 0.1 * 0.698 + 0.05 * 0.92, 2);
		// MY DESIGN PROCESS (arimo, 0.8): 0.827em in Canva, 0.749em on the web.
		expect(canvaFit('arimo', 0.8).dy).toBeCloseTo(0.078, 2);
		// EDUCATION (montserrat, 1): 0.92em in Canva, 0.859em on the web.
		expect(canvaFit('montserrat', 1).dy).toBeCloseTo(0.061, 2);
	});

	test('a taller line height moves web text down, so the shift shrinks', () => {
		expect(canvaFit('arimo', 1.4).dy).toBeCloseTo(canvaFit('arimo', 0.8).dy - 0.3, 5);
	});
});
