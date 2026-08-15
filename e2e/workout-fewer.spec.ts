import { test, expect, type Page } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

async function clearRestGate(page: Page) {
  const skip = page.getByRole('button', { name: /skip|пропуск/i })
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
  }
}

test.describe('Workout log fewer', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('hides main actions when logging different number', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)

    await page.getByRole('button', { name: /different number|другое число/i }).click()

    await expect(page.getByRole('button', { name: /different number|другое число/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /done — \d+ reps/i })).toHaveCount(0)
    await expect(page.locator('#fewer-input')).toBeVisible()

    await page.locator('#fewer-input').fill('3')
    await page.getByRole('button', { name: 'Confirm' }).click()
    await clearRestGate(page)

    await expect(page.getByRole('button', { name: /done — \d+ reps/i })).toBeVisible()
  })
})
