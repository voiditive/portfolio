import { describe, expect, test } from 'vitest';
import { cardOrder, navItems, nextPage } from '../../src/lib/nav';

const projects = [
	{ slug: 'pipboy', navLabel: 'pipboy', order: 1, number: 1 },
	{ slug: 'widw', navLabel: 'widw', order: 2, number: 2 },
	{ slug: 'ishda', navLabel: 'ishda', order: 4, number: 4 },
	{ slug: 'yume', navLabel: 'yume', order: 5, number: 3 },
];
const illustrations = { navLabel: 'illustrations', order: 3 };

describe('navItems', () => {
	test('lists about me first, then pages in Canva page order', () => {
		expect(navItems(projects, illustrations).map((i) => i.label)).toEqual([
			'about me',
			'pipboy',
			'widw',
			'illustrations',
			'ishda',
			'yume',
		]);
	});

	test('a new project joins the end of the nav', () => {
		const items = navItems([...projects, { slug: 'lamp', navLabel: 'lamp', order: 6, number: 5 }], illustrations);
		expect(items.at(-1)).toEqual({ label: 'lamp', href: '/lamp', order: 6 });
		expect(nextPage('/yume', items)?.href).toBe('/lamp');
	});
});

describe('nextPage', () => {
	const items = navItems(projects, illustrations);

	test('home continues to the first project', () => {
		expect(nextPage('/', items)?.href).toBe('/pipboy');
	});

	test('each page continues to the next in order', () => {
		expect(nextPage('/widw', items)?.href).toBe('/illustrations');
		expect(nextPage('/illustrations', items)?.href).toBe('/ishda');
	});

	test('the last page has nowhere to continue to', () => {
		expect(nextPage('/yume', items)).toBeUndefined();
	});
});

describe('cardOrder', () => {
	test('sorts home cards by their card number, not page order', () => {
		expect(cardOrder(projects).map((p) => p.slug)).toEqual(['pipboy', 'widw', 'yume', 'ishda']);
	});
});
