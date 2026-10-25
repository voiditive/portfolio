import { defineCollection, z } from 'astro:content';
import { sectionSchema } from './lib/section-schema';
import { glob } from 'astro/loaders';

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
