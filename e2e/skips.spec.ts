import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  readProgress,
  readRecords,
  todayLocal,
  addDays,
  freezeToday,
} from './helpers/app'

test.describe('Missed workout policy', () => {
  test.beforeEach(async ({ page }) => {
    await freezeToday(page)
  })

  const today = todayLocal()
  const missedDate = addDays(today, -3)

  test('past missed slot becomes fail record on open', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: missedDate, stepRef: 2 },
        { date: addDays(today, 2), stepRef: 3 },
      ],
      state: { stepInCycle: 2 },
    })

    const records = (await readRecords(page)) as { date: string; result: string }[]
    expect(records.some((r) => r.date === missedDate && r.result === 'fail')).toBe(true)

    const progress = await readProgress(page)
    expect(progress?.lastWorkoutDate).toBe(missedDate)
    const schedule = progress?.schedule as { date: string; stepRef: number }[]
    expect(schedule[0]?.date).toBe(addDays(today, 2))
  })

  test('home does not offer repeat missed workout', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: missedDate, stepRef: 2 },
        { date: addDays(today, 2), stepRef: 3 },
      ],
    })
    await expect(page.getByRole('button', { name: /repeat missed|пропущенную/i })).toHaveCount(0)
  })

  test('settled missed day shows failed styling in calendar', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: missedDate, stepRef: 2 },
        { date: addDays(today, 2), stepRef: 3 },
      ],
    })
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await expect(page.locator('.day.failed').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.day.missed')).toHaveCount(0)
  })
})
