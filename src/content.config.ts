import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import type { ImageFunction } from 'astro:content';

// Every page is a list of sections (Canva's 1366 x 768 frames), each holding blocks
// placed at their Canva position: x, y, w, h are Canva pixels within the section.
function sectionSchema(image: ImageFunction) {
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
			font: z.enum(['spartan', 'arimo', 'montserrat']),
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
		alt: z.string(),
	});
	return z.object({
		anchor: z.string().optional(),
		background: image().optional(),
		color: z.string().default('#ffffff'),
		height: z.number().default(768),
		blocks: z.array(z.discriminatedUnion('kind', [text, media])),
	});
}

const site = defineCollection({
	loader: glob({ pattern: 'site.yaml', base: './src/content/site' }),
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			email: z.string(),
			phone: z.string(),
			cvUrl: z.string().url(),
			sections: z.array(sectionSchema(image)),
			/** The thank-you frame shown after the last page in the chain. */
			closing: sectionSchema(image).optional(),
		}),
});

const projects = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			number: z.number().int(),
			order: z.number().int(),
			navLabel: z.string(),
			title: z.string(),
			cardTitle: z.string(),
			designDate: z.string(),
			cardImage: image(),
			sections: z.array(sectionSchema(image)).default([]),
		}),
});

const illustrations = defineCollection({
	loader: glob({ pattern: 'illustrations.yaml', base: './src/content/illustrations' }),
	schema: ({ image }) =>
		z.object({
			navLabel: z.string(),
			order: z.number().int(),
			sections: z.array(sectionSchema(image)),
		}),
});

export const collections = { site, projects, illustrations };
