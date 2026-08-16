import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('Level label on stats', () => {
  test('shows level for M=7 on stats screen', async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page.getByText(/level.*base|уровень.*база/i)).toBeVisible()
  })
})
