import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('Compliance smoke', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('no monetization or audio elements', async ({ page }) => {
    await expect(page.locator('audio, video')).toHaveCount(0)
    await expect(page.getByText(/subscribe|premium|donate|реклама|подписк/i)).toHaveCount(0)
  })

  test('settings exposes 14 palette options', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page.locator('#palette-select option')).toHaveCount(14)
  })

  test('about shows version and science link', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('link', { name: /about|о приложении/i }).click()
    await expect(page.getByText(/1\.0\.0/)).toBeVisible()
    await page.getByRole('link', { name: /why this program|почему программа/i }).click()
    await expect(page).toHaveURL(/\/why/)
  })

  test('science page reachable in RU', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'RU' }).click()
    await page.getByRole('link', { name: 'О приложении' }).click()
    await page.getByRole('link', { name: 'Почему такая программа' }).click()
    await expect(page.getByRole('heading', { name: 'Почему такая программа' })).toBeVisible()
  })
})
