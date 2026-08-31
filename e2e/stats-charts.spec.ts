import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  todayLocal,
  buildStatsHistory,
  assertNoTextOverlap,
  dismissPwaModal,
  freezeToday,
} from './helpers/app'

async function openStatsWithHistory(page: import('@playwright/test').Page) {
  const today = todayLocal()
  await prepareProgress(page, {
    anchor: 7,
    today,
    lastWorkoutDate: today,
    workoutRecords: buildStatsHistory(today, 18),
  })
  await page.getByRole('link', { name: 'Stats' }).click()
  await expect(page).toHaveURL(/\/stats/)
  await expect(page.locator('.chart-wrap svg.chart')).toHaveCount(2)
}

function isMobileProject(projectName: string) {
  return projectName === 'Mobile Chrome'
}

test.describe('Stats chart labels', () => {
  test.beforeEach(async ({ page }) => {
    await freezeToday(page)
  })

  test('max chart labels do not overlap', async ({ page }, testInfo) => {
    await openStatsWithHistory(page)
    const mobile = isMobileProject(testInfo.project.name)
    const maxChart = page.locator('.chart-wrap svg.chart').first()
    await expect(maxChart.locator('circle')).toHaveCount(mobile ? 4 : 6)
    await assertNoTextOverlap(page, 0, '.chart-label')
    await assertNoTextOverlap(page, 0, '.chart-val')
    // The y-axis ticks share the left gutter with the first value label.
    await assertNoTextOverlap(page, 0, '.chart-tick, .chart-val')
  })

  test('weekly volume chart labels do not overlap', async ({ page }, testInfo) => {
    await openStatsWithHistory(page)
    const mobile = isMobileProject(testInfo.project.name)
    const weeklyChart = page.locator('.chart-wrap svg.chart').nth(1)
    await expect(weeklyChart.locator('rect.bar')).toHaveCount(mobile ? 4 : 7)
    await assertNoTextOverlap(page, 1, '.chart-label')
    await assertNoTextOverlap(page, 1, '.chart-val')
    await assertNoTextOverlap(page, 1, '.chart-tick, .chart-val')
  })

  test('RU locale chart labels do not overlap on desktop', async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'desktop RU stress case')
    const today = todayLocal()
    await prepareProgress(page, {
      anchor: 7,
      today,
      lastWorkoutDate: today,
      language: 'ru',
      workoutRecords: buildStatsHistory(today, 18),
    })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.getByRole('link', { name: /stats|статистика/i }).click()
    await expect(page.locator('.chart-wrap svg.chart').first().locator('circle')).toHaveCount(6)
    await assertNoTextOverlap(page, 0, '.chart-label')
    await assertNoTextOverlap(page, 0, '.chart-val')
    await assertNoTextOverlap(page, 1, '.chart-label')
    await assertNoTextOverlap(page, 1, '.chart-val')
    await assertNoTextOverlap(page, 0, '.chart-tick, .chart-val')
    await assertNoTextOverlap(page, 1, '.chart-tick, .chart-val')
  })
})
