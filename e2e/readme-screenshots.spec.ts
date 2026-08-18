import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import {
  resetApp,
  seedProgress,
  dismissPwaModal,
  startWorkout,
  clearRestGate,
  addDays,
  buildStatsHistory,
} from './helpers/app'

const TODAY = '2026-08-18'
const SCREENSHOT_DIR = path.join('docs', 'readme', 'screenshots')

const README_SEED = {
  palette: 'p01-volt',
  themeMode: 'dark' as const,
  language: 'en' as const,
  restAutoStart: true,
  restDurationSeconds: 180,
  frequencyDays: 3 as const,
  weekdays: ['mon', 'wed', 'fri'] as const,
}

function buildCalendarSchedule(today: string) {
  const slots: { date: string; stepRef: number }[] = []
  let date = addDays(today, -56)
  while (date <= addDays(today, 28)) {
    const day = new Date(`${date}T12:00:00`).getDay()
    if (day === 1 || day === 3 || day === 5) {
      const stepRef = ((slots.length % 6) + 1) as number
      slots.push({ date, stepRef })
    }
    date = addDays(date, 1)
  }
  const todaySlot = slots.find((s) => s.date === today)
  if (!todaySlot) {
    slots.push({ date: today, stepRef: 3 })
    slots.sort((a, b) => a.date.localeCompare(b.date))
  }
  return slots
}

function buildHomeSchedule(today: string) {
  return [
    { date: today, stepRef: 3 },
    { date: addDays(today, 2), stepRef: 3 },
    { date: addDays(today, 5), stepRef: 4 },
    { date: addDays(today, 9), stepRef: 4 },
    { date: addDays(today, 12), stepRef: 5 },
    { date: addDays(today, 16), stepRef: 5 },
  ]
}

function buildHomeHistory(today: string) {
  const dates = [
    addDays(today, -14),
    addDays(today, -12),
    addDays(today, -9),
    addDays(today, -7),
    addDays(today, -4),
    addDays(today, -2),
  ]
  return dates.map((date, i) => ({
    date,
    result: 'success' as const,
    stepInCycle: (i % 6) + 1,
    totals: { volumeReps: 28 + i * 2, maxSetReps: 9 + (i % 4) },
  }))
}

async function prepareContourForScreenshot(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const wrap = document.querySelector('.contour-number-wrap')
    if (!wrap) return
    const value = wrap.querySelector('.sr-only')?.textContent?.trim() ?? ''
    wrap.innerHTML = `<div class="contour-number-fallback" aria-hidden="true">${value}</div><span class="sr-only">${value}</span>`
    const el = wrap.querySelector('.contour-number-fallback') as HTMLElement
    el.style.cssText = [
      'font-family: "Arial Black", system-ui, sans-serif',
      'font-size: clamp(5rem, min(28vw, 26vh), 9rem)',
      'font-weight: 900',
      'line-height: 1',
      'color: transparent',
      '-webkit-text-stroke: 2.5px rgb(198, 255, 59)',
    ].join(';')
  })
}

async function captureAppShell(page: import('@playwright/test').Page, name: string) {
  const shell = page.locator('.app-shell')
  await expect(shell).toBeVisible()
  await shell.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) })
}

test.describe('README screenshots', () => {
  test.skip(!process.env.UPDATE_README_SCREENSHOTS, 'Set UPDATE_README_SCREENSHOTS=1 to capture')

  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  })

  test('capture home', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Mobile Chrome only')
    await resetApp(page)
    await seedProgress(page, {
      ...README_SEED,
      anchor: 15,
      today: TODAY,
      stepRef: 3,
      lastWorkoutDate: addDays(TODAY, -2),
      schedule: buildHomeSchedule(TODAY),
      state: { stepInCycle: 3, cycleIndex: 1, level: 'L3' },
      workoutRecords: buildHomeHistory(TODAY),
    })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.goto('.')
    await dismissPwaModal(page)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await captureAppShell(page, 'home')
  })

  test('capture workout', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Mobile Chrome only')
    await resetApp(page)
    await seedProgress(page, {
      ...README_SEED,
      anchor: 7,
      today: TODAY,
      stepRef: 1,
      lastWorkoutDate: addDays(TODAY, -3),
      schedule: [{ date: TODAY, stepRef: 1 }],
    })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await startWorkout(page, TODAY)
    await clearRestGate(page)
    await expect(page.locator('.top-progress')).toContainText(/set/i)
    await prepareContourForScreenshot(page)
    await captureAppShell(page, 'workout')
  })

  test('capture rest', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Mobile Chrome only')
    await resetApp(page)
    await seedProgress(page, {
      ...README_SEED,
      anchor: 7,
      today: TODAY,
      stepRef: 1,
      lastWorkoutDate: addDays(TODAY, -3),
      schedule: [{ date: TODAY, stepRef: 1 }],
    })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await startWorkout(page, TODAY)
    await clearRestGate(page)
    await page.getByRole('button', { name: /^done$/i }).click()
    await expect(page.locator('.ring-num')).toHaveText('3:00', { timeout: 10_000 })
    await captureAppShell(page, 'rest')
  })

  test('capture calendar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Mobile Chrome only')
    const schedule = buildCalendarSchedule(TODAY)
    const pastRecords = schedule
      .filter((s) => s.date < TODAY)
      .map((s) => ({
        date: s.date,
        result: 'success' as const,
        stepInCycle: s.stepRef,
        totals: { volumeReps: 32, maxSetReps: 10 },
      }))
    await resetApp(page)
    await seedProgress(page, {
      ...README_SEED,
      anchor: 12,
      today: TODAY,
      stepRef: 3,
      lastWorkoutDate: addDays(TODAY, -2),
      schedule,
      workoutRecords: pastRecords,
    })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)
    await captureAppShell(page, 'calendar')
  })

  test('capture stats', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Mobile Chrome only')
    await resetApp(page)
    await seedProgress(page, {
      ...README_SEED,
      anchor: 7,
      today: TODAY,
      stepRef: 2,
      lastWorkoutDate: TODAY,
      schedule: [{ date: addDays(TODAY, 2), stepRef: 2 }],
      workoutRecords: buildStatsHistory(TODAY, 18),
    })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page).toHaveURL(/\/stats/)
    await expect(page.locator('.chart-wrap svg.chart')).toHaveCount(2)
    await captureAppShell(page, 'stats')
  })
})
