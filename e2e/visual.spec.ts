import { test, expect, type Page } from '@playwright/test'
import {
  addDays,
  buildStatsHistory,
  gotoApp,
  prepareProgress,
  startWorkout,
} from './helpers/app'

const TODAY = '2026-08-18'
const PALETTES = [
  'p01-volt',
  'p02-signal-orange',
  'p03-cobalt',
  'p04-magenta-pop',
  'p05-taxi',
  'p06-paper-red',
  'p07-mint-terminal',
  'p08-amber',
  'p09-cyan-future',
  'p10-crimson',
  'p11-spring-green',
  'p12-ultraviolet',
  'p13-coral-sunrise',
  'p14-mono-ink',
]
const MODES = ['dark', 'light'] as const

const SEED = {
  today: TODAY,
  anchor: 7,
  language: 'en' as const,
  restAutoStart: false,
  restDurationSeconds: 180,
  frequencyDays: 3 as const,
  weekdays: ['mon', 'wed', 'fri'],
  schedule: [
    { date: addDays(TODAY, -4), stepRef: 1 },
    { date: addDays(TODAY, -2), stepRef: 2 },
    { date: TODAY, stepRef: 3 },
    { date: addDays(TODAY, 2), stepRef: 4 },
  ],
  workoutRecords: buildStatsHistory(TODAY, 14),
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
}

test.describe('visual regression', () => {
  test.skip(
    !process.env.VISUAL,
    'Baselines are platform-specific; set VISUAL=1 (npm run test:visual) to run locally',
  )

  test.describe('palettes on the home screen', () => {
    for (const palette of PALETTES) {
      for (const mode of MODES) {
        test(`${palette} ${mode}`, async ({ page }) => {
          await prepareProgress(page, { ...SEED, palette, themeMode: mode })
          await gotoApp(page)
          await settle(page)
          await expect(page).toHaveScreenshot(`home-${palette}-${mode}.png`, {
            fullPage: true,
            maxDiffPixelRatio: 0.01,
          })
        })
      }
    }
  })

  test.describe('screens on the default palette', () => {
    const SCREENS: { name: string; path: string }[] = [
      { name: 'home', path: '' },
      { name: 'calendar', path: '/calendar' },
      { name: 'stats', path: '/stats' },
      { name: 'settings', path: '/settings' },
      { name: 'about', path: '/about' },
      { name: 'why', path: '/why' },
    ]

    for (const mode of MODES) {
      for (const screen of SCREENS) {
        test(`${screen.name} ${mode}`, async ({ page }) => {
          await prepareProgress(page, { ...SEED, palette: 'p01-volt', themeMode: mode })
          await gotoApp(page, screen.path)
          await settle(page)
          await expect(page).toHaveScreenshot(`screen-${screen.name}-${mode}.png`, {
            fullPage: true,
            maxDiffPixelRatio: 0.01,
          })
        })
      }

      test(`workout ${mode}`, async ({ page }) => {
        await prepareProgress(page, { ...SEED, palette: 'p01-volt', themeMode: mode })
        await startWorkout(page, TODAY)
        await settle(page)
        await expect(page).toHaveScreenshot(`screen-workout-${mode}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.01,
        })
      })
    }
  })

  test('onboarding renders on the default palette', async ({ page }) => {
    await prepareProgress(page, { ...SEED, palette: 'p01-volt', themeMode: 'dark' })
    await gotoApp(page, '/onboarding')
    await settle(page)
    await expect(page).toHaveScreenshot('screen-onboarding-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    })
  })
})
