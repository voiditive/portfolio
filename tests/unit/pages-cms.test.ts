import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';

// Pages CMS edits the content files through .pages.yml. Two things must hold:
// uploaded images get a path Astro resolves from the content file, and every key
// in the content has a CMS field, so saving an entry never drops data.

type Field = {
	name: string;
	type?: string;
	component?: string;
	list?: boolean;
	fields?: Field[];
	blocks?: Field[];
	blockKey?: string;
};
type Entry = { name: string; type: 'file' | 'collection'; path: string; format?: string; fields: Field[] };
type Config = { media: { input: string; output: string }; components?: Record<string, Omit<Field, 'name'>>; content: Entry[] };

const root = path.resolve(__dirname, '../..');
const config = parse(readFileSync(path.join(root, '.pages.yml'), 'utf8')) as Config;

/** A field with its component (if any) merged in, field keys winning. */
function expand(field: Field): Field {
	if (!field.component) return field;
	const base = config.components?.[field.component];
	if (!base) throw new Error(`unknown component ${field.component}`);
	return { ...base, ...field };
}

/** Paths of every key in `value` that `fields` doesn't declare. */
function undeclared(value: unknown, fields: Field[], at: string): string[] {
	if (value === null || typeof value !== 'object') return [];
	const byName = new Map(fields.map((f) => [f.name, expand(f)]));
	return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) => {
		const field = byName.get(key);
		if (!field) return [`${at}.${key}`];
		const items = field.list ? (v as unknown[]) : [v];
		return items.flatMap((item, i) => {
			const here = field.list ? `${at}.${key}[${i}]` : `${at}.${key}`;
			if (field.type === 'block') {
				const blockKey = field.blockKey ?? '_block';
				const kind = (item as Record<string, unknown>)[blockKey];
				const block = field.blocks?.map(expand).find((b) => b.name === kind);
				if (!block) return [`${here} (no block "${kind}")`];
				const { [blockKey]: _, ...rest } = item as Record<string, unknown>;
				return undeclared(rest, block.fields ?? [], here);
			}
			return field.type === 'object' ? undeclared(item, field.fields ?? [], here) : [];
		});
	});
}

/** The data Astro reads from one content file. */
function readContent(file: string): unknown {
	const text = readFileSync(file, 'utf8');
	if (!file.endsWith('.md')) return parse(text);
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
	if (!match) throw new Error(`${file} has no frontmatter`);
	return parse(match[1]);
}

function contentFiles(entry: Entry): string[] {
	const where = path.join(root, entry.path);
	if (entry.type === 'file') return [where];
	return readdirSync(where)
		.filter((f) => f.endsWith('.md'))
		.map((f) => path.join(where, f));
}

const entry = (name: string) => config.content.find((e) => e.name === name)!;

describe('.pages.yml', () => {
	test('edits the site file, the project collection and the illustrations file', () => {
		expect(config.content.map((e) => [e.name, e.type, e.path])).toEqual([
			['site', 'file', 'src/content/site/site.yaml'],
			['projects', 'collection', 'src/content/projects'],
			['illustrations', 'file', 'src/content/illustrations/illustrations.yaml'],
		]);
		expect(entry('projects').format).toBe('yaml-frontmatter');
	});

	test('uploads land in src/assets/images', () => {
		expect(config.media.input).toBe('src/assets/images');
	});

	test.each(['site', 'projects', 'illustrations'])('%s: the media output path resolves to the media input folder', (name) => {
		for (const file of contentFiles(entry(name))) {
			expect(path.resolve(path.dirname(file), config.media.output)).toBe(path.resolve(root, config.media.input));
		}
	});

	test.each(['site', 'projects', 'illustrations'])('%s: every key in the content has a CMS field', (name) => {
		const e = entry(name);
		for (const file of contentFiles(e)) {
			expect(undeclared(readContent(file), e.fields, path.basename(file))).toEqual([]);
		}
	});

	test('the checker flags an undeclared key', () => {
		expect(undeclared({ title: 'x', extra: 1 }, [{ name: 'title', type: 'string' }], 'f')).toEqual(['f.extra']);
	});
});
