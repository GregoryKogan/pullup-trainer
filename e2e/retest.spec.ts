import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  readProgress,
  readRecords,
  todayLocal,
  addDays,
} from './helpers/app'

test.describe('Retest prompts', () => {
  const today = todayLocal()

  test('shows retest prompt after 15-day break', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      lastWorkoutDate: addDays(today, -15),
    })
    await expect(page.getByRole('button', { name: /retest max|новый тест/i })).toBeVisible()
  })

  test('shows retest prompt after two completed cycles', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      lastWorkoutDate: addDays(today, -1),
      state: { cycleIndex: 2, lastRetestCycleIndex: 0 },
    })
    await expect(page.getByRole('button', { name: /retest max|новый тест/i })).toBeVisible()
  })

  test('retest from home saves test record and updates anchor', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      lastWorkoutDate: addDays(today, -15),
    })
    await page.getByRole('button', { name: /retest max|новый тест/i }).click()
    await page.locator('#retest-reps').fill('9')
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()

    const progress = await readProgress(page)
    const state = progress?.state as { anchor: number }
    expect(state.anchor).toBe(9)

    const records = (await readRecords(page)) as { kind: string; sets: { done: number }[] }[]
    const testRecord = records.find((r) => r.kind === 'test')
    expect(testRecord?.sets[0]?.done).toBe(9)
  })
})
