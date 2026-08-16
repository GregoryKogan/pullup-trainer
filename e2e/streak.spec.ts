import { test, expect } from '@playwright/test'
import { prepareProgress, todayLocal } from './helpers/app'

test.describe('Weekly streak', () => {
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
})
