export type NavItem = { label: string; href: string; order: number };

const ABOUT: NavItem = { label: 'about me', href: '/#about', order: 0 };

/** The top nav: "about me" first, then every page in Canva page order. */
export function navItems(
	projects: { slug: string; navLabel: string; order: number }[],
	illustrations: { navLabel: string; order: number },
): NavItem[] {
	const pages = [
		...projects.map((p) => ({ label: p.navLabel, href: `/${p.slug}`, order: p.order })),
		{ label: illustrations.navLabel, href: '/illustrations', order: illustrations.order },
	].sort((a, b) => a.order - b.order);
	return [ABOUT, ...pages];
}

/** Where "click me to continue" leads from a page; undefined on the last page. */
export function nextPage(currentHref: string, items: NavItem[]): NavItem | undefined {
	const pages = items.filter((item) => item !== ABOUT && item.href !== ABOUT.href);
	if (currentHref === '/') return pages[0];
	const index = pages.findIndex((item) => item.href === currentHref);
	return index === -1 ? undefined : pages[index + 1];
}

/** Home page cards are numbered (01) to (04), which is not the page order. */
export function cardOrder<T extends { number: number }>(projects: T[]): T[] {
	return [...projects].sort((a, b) => a.number - b.number);
}
