import { test, expect } from '@playwright/test'
import { prepareProgress, todayLocal, addDays, startOfWeek, freezeToday} from './helpers/app'

test.describe('Weekly streak', () => {
  test.beforeEach(async ({ page }) => {
    await freezeToday(page)
  })

  // D8: streak counts weeks with enough successful workouts
  test('shows streak after successful workouts in current week', async ({ page }) => {
    const today = todayLocal()

    await prepareProgress(page, {
      anchor: 7,
      today,
      frequencyDays: 2,
      schedule: [{ date: today, stepRef: 1 }],
      workoutRecords: [{ date: today, result: 'success' }],
    })

    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page.locator('.streak-num')).not.toHaveText('0')
  })

  test('streak survives one missed day in week with enough successes', async ({ page }) => {
    const today = todayLocal()
    const weekStart = startOfWeek(today)

    await prepareProgress(page, {
      anchor: 7,
      today,
      frequencyDays: 3,
      schedule: [{ date: today, stepRef: 1 }],
      workoutRecords: [
        { date: addDays(weekStart, 2), result: 'success' },
        { date: addDays(weekStart, 4), result: 'success' },
      ],
    })

    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page.locator('.streak-num')).not.toHaveText('0')
  })
})
