import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import CanvaSection from '../../src/components/CanvaSection.astro';

const style = { font: 'futura', size: 40, weight: 700, color: '#1e1e1e', align: 'start', lh: 1, ls: 0 } as const;
const text = (label: string, value: string, as: 'h1' | 'h2' | 'p' = 'p') => ({
	kind: 'text' as const,
	label,
	text: value,
	as,
	x: 10,
	y: 10,
	w: 300,
	h: 50,
	style,
});

async function render(blocks: ReturnType<typeof text>[]) {
	const container = await AstroContainer.create();
	return container.renderToString(CanvaSection, { props: { section: { color: '#ffffff', height: 768, blocks } } });
}

describe('CanvaSection with content a CMS edit left partly empty', () => {
	test('a heading whose text was cleared is left out, the rest still renders', async () => {
		const html = await render([text('Title', '  ', 'h2'), text('Body', 'Hello there')]);
		expect(html).not.toMatch(/<h2[^>]*>\s*<\/h2>/);
		expect(html).not.toContain('<h2');
		expect(html).toContain('Hello there');
	});

	test('a section with no blocks and no background renders nothing', async () => {
		expect((await render([])).trim()).toBe('');
	});
});
