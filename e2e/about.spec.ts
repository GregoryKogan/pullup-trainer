import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('About and Why', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('about opens why and returns', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about/)

    await page.getByRole('link', { name: /why this program|почему такая программа/i }).click()
    await expect(page).toHaveURL(/\/why$/)

    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page).toHaveURL(/\/about/)

    await page.getByRole('link', { name: /open research sources|открытые источники/i }).click()
    await expect(page).toHaveURL(/\/why#sources/)
    await expect(page.locator('#sources')).toBeInViewport()

    const scrollTop = page.getByRole('button', { name: /back to top|наверх/i })
    await expect(scrollTop).toBeVisible()
    await scrollTop.click()
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeInViewport()
  })
})
