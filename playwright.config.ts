import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  expect: {
    // pixelmatch's default threshold (0.2) is a perceptual YIQ distance wide
    // enough to hide a token swap on small text; keep it tight.
    toHaveScreenshot: { threshold: 0.02, maxDiffPixels: 0 },
  },
  use: {
    baseURL: 'http://127.0.0.1:4173/pullup-trainer/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/pullup-trainer/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
