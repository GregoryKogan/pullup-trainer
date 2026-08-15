import { test, expect, type Page } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

async function clearRestGate(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip' })
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
    return
  }
  const preset90 = page.getByRole('button', { name: '90s' })
  if (await preset90.isVisible().catch(() => false)) {
    await preset90.click()
    await skip.waitFor({ state: 'visible', timeout: 5000 })
    await skip.click()
  }
}

test.describe('Workout log fewer', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('hides main actions when logging fewer', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()

    const preset90 = page.getByRole('button', { name: '90s' })
    if (await preset90.isVisible().catch(() => false)) {
      await preset90.click()
      await page.getByRole('button', { name: 'Skip' }).click()
    }

    await page.getByRole('button', { name: 'Log fewer' }).click()

    await expect(page.getByRole('button', { name: 'Log fewer' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /done — \d+ reps/i })).toHaveCount(0)
    await expect(page.locator('#fewer-input')).toBeVisible()

    await page.locator('#fewer-input').fill('3')
    await page.getByRole('button', { name: 'Confirm' }).click()
    await clearRestGate(page)

    await expect(page.getByRole('button', { name: /done — \d+ reps/i })).toBeVisible()
  })
})
