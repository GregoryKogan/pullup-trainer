import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  readProgress,
  todayLocal,
  addDays,
} from './helpers/app'

test.describe('Skip policy', () => {
  const today = todayLocal()
  const missedDate = addDays(today, -3)

  test('autoshift keeps stepRef and moves later dates', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: missedDate, stepRef: 2 },
        { date: today, stepRef: 3 },
        { date: addDays(today, 3), stepRef: 4 },
      ],
      state: { stepInCycle: 2 },
    })

    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await expect(page.getByText(/Missed workout moved|пропущенная тренировка/i)).toBeVisible({
      timeout: 5000,
    })

    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string; stepRef: number }[]
    expect(schedule[0]?.stepRef).toBe(2)
    expect(schedule[0]?.date).toBe(missedDate)
    expect(schedule[1]?.date).not.toBe(today)
  })

  test('home offers repeat missed workout', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: missedDate, stepRef: 2 },
        { date: addDays(today, 2), stepRef: 3 },
      ],
    })
    await expect(page.getByRole('button', { name: /repeat missed|пропущенную/i })).toBeVisible()
  })

  test('missed day uses neutral styling', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: missedDate, stepRef: 2 },
        { date: addDays(today, 2), stepRef: 3 },
      ],
    })
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await expect(page.locator('.day.missed').first()).toBeVisible({ timeout: 5000 })

    const missedDay = page.locator('.day.missed').first()
    const borderColor = await missedDay.evaluate((el) => getComputedStyle(el).borderColor)
    const badColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bad').trim())
    expect(borderColor).not.toContain(badColor || 'rgb(255, 0, 0)')
  })
})
