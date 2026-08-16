import { test, expect } from '@playwright/test'
import { prepareSeededApp, startWorkout, todayLocal } from './helpers/app'

test.describe('Absent features', () => {
  const today = todayLocal()

  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, today)
  })

  test('settings has only 2x and 3x frequency', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: /3× \/ week|3× \/ нед/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /2× \/ week|2× \/ нед/i })).toBeVisible()
    await expect(page.getByText(/daily|every day|ежеднев/i)).toHaveCount(0)
  })

  test('workout has no RPE controls', async ({ page }) => {
    await startWorkout(page)
    await expect(page.getByText(/\bRPE\b|\bRIR\b|запас повторений/i)).toHaveCount(0)
  })
})
