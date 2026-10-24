import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
	testDir: 'tests/e2e',
	use: { baseURL },
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
		{ name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
	],
	// Against a deployed site (BASE_URL set) there is no local server to start.
	webServer: process.env.BASE_URL
		? undefined
		: { command: 'npm run build && npm run preview', url: baseURL, reuseExistingServer: true, timeout: 180_000 },
});
