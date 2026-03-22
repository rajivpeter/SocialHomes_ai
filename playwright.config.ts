import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://socialhomes.ai',
    trace: 'on-first-retry',
    screenshot: 'on',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /repair-.*\.spec\.ts/,
    },
  ],
  outputDir: './playwright-report/test-results',
});
