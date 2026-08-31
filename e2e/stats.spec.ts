import { test, expect } from '@playwright/test'
import {
  prepareSeededApp,
  todayLocal,
  completeWorkout,
  seedWorkoutRecord,
  addDays,
  dismissPwaModal,
} from './helpers/app'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

test.describe('Stats', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('shows stats page with export and empty chart hint', async ({ page }) => {
    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page).toHaveURL(/\/stats/)
    await expect(page.getByRole('heading', { name: /stats|статистика/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /export history json|экспорт истории json/i })).toBeVisible()
    await expect(page.getByText(/complete more workouts|сделай больше тренировок/i).first()).toBeVisible()
  })

  test('export history downloads valid JSON', async ({ page }) => {
    await page.getByRole('link', { name: 'Stats' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export history json|экспорт истории json/i }).click()
    const download = await downloadPromise

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-history-'))
    const historyPath = path.join(tmpDir, 'pullup-trainer-history.json')
    await download.saveAs(historyPath)

    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf8')) as {
      format?: string
      records?: unknown[]
    }
    expect(raw.format).toBe('pullup-trainer.history')
    expect(Array.isArray(raw.records)).toBe(true)
  })

  // E1–E5: charts and history populate after a completed workout
  test('shows max chart and history after workout', async ({ page }) => {
    await completeWorkout(page, '8')
    await page.getByRole('button', { name: /home|главная/i }).click()
    await page.getByRole('link', { name: 'Stats' }).click()

    await expect(page.locator('.chart-wrap svg.chart').first()).toBeVisible()
    await expect(page.getByText(/complete more workouts/i)).toHaveCount(0)
    await expect(page.locator('.hist li').first()).toBeVisible()
    await expect(page.locator('.kpi b').first()).not.toHaveText('0')
  })

  test('weekly volume chart appears after workout', async ({ page }) => {
    await completeWorkout(page, '8')
    await page.getByRole('button', { name: /home|главная/i }).click()
    await page.getByRole('link', { name: 'Stats' }).click()

    await expect(page.getByRole('heading', { name: /weekly volume|объём по неделям/i })).toBeVisible()
    await expect(page.locator('.chart-wrap svg.chart').nth(1)).toBeVisible()
  })

  test('month filter lists only months with records and narrows history', async ({ page }) => {
    const older = addDays(todayLocal(), -70)
    await seedWorkoutRecord(page, { date: older, result: 'success', totals: { volumeReps: 40, maxSetReps: 8 } })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await completeWorkout(page, '8')
    await page.getByRole('button', { name: /home|главная/i }).click()
    await page.getByRole('link', { name: 'Stats' }).click()

    const filter = page.locator('.month-filter')
    const thisMonth = todayLocal().slice(0, 7)
    const olderMonth = older.slice(0, 7)
    await expect(filter.locator('option')).toHaveCount(3)

    const total = await page.locator('.hist li').count()
    await filter.selectOption(olderMonth)
    await expect(page.locator('.hist li')).toHaveCount(1)

    await filter.selectOption(thisMonth)
    await expect(page.locator('.hist li')).toHaveCount(total - 1)

    await filter.selectOption('')
    await expect(page.locator('.hist li')).toHaveCount(total)
  })
})
