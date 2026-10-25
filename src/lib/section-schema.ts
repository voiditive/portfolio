import { z } from 'astro/zod';
import type { ImageFunction } from 'astro:content';

// Every page is a list of sections (Canva's 1366 x 768 frames), each holding blocks
// placed at their Canva position: x, y, w, h are Canva pixels within the section.
export function sectionSchema(image: ImageFunction) {
	const box = { label: z.string(), x: z.number(), y: z.number(), w: z.number(), decor: z.boolean().optional(), link: z.string().optional() };
	const text = z.object({
		kind: z.literal('text'),
		...box,
		text: z.string(),
		/** Canva box height: tells whether Canva wrapped the text itself. */
		h: z.number().optional(),
		as: z.enum(['h1', 'h2', 'p']).default('p'),
		rot: z.number().optional(),
		style: z.object({
			font: z.enum(['futura', 'arimo', 'montserrat']),
			size: z.number(),
			weight: z.number(),
			color: z.string(),
			align: z.enum(['start', 'center', 'end', 'justify']),
			lh: z.number(),
			ls: z.number(),
		}),
	});
	const media = z.object({
		kind: z.enum(['image', 'video']),
		...box,
		h: z.number(),
		image: image(),
		/** Empty for decoration. Pages CMS drops empty strings when it saves, hence the default. */
		alt: z.string().default(''),
	});
	return z.object({
		anchor: z.string().optional(),
		background: image().optional(),
		color: z.string().default('#ffffff'),
		height: z.number().default(768),
		blocks: z.array(z.discriminatedUnion('kind', [text, media])),
	});
}
