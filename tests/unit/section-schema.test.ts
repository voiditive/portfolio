import { z } from 'astro/zod';
import { describe, expect, test } from 'vitest';
import { sectionSchema } from '../../src/lib/section-schema';

// Astro's image() checks the file exists; a plain string stands in for it here.
const section = sectionSchema((() => z.string()) as never);

const media = { kind: 'image', label: 'Decoration', image: 'a.webp', x: 0, y: 0, w: 10, h: 10 };

describe('sectionSchema', () => {
	test('an image saved without alt (Pages CMS drops empty strings) is decorative', () => {
		const parsed = section.parse({ blocks: [media] });
		expect(parsed.blocks[0]).toMatchObject({ alt: '' });
	});

	test('keeps a written alt text', () => {
		const parsed = section.parse({ blocks: [{ ...media, alt: 'Pip-Boy clock, front' }] });
		expect(parsed.blocks[0]).toMatchObject({ alt: 'Pip-Boy clock, front' });
	});

	test('decor: false (written by Pages CMS) parses like no decor', () => {
		const parsed = section.parse({ blocks: [{ ...media, decor: false }] });
		expect(parsed.blocks[0]).toMatchObject({ decor: false });
	});
});
