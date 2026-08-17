import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('theme and language controls work', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)

    await page.getByRole('button', { name: 'Dark' }).click()
    await page.getByRole('button', { name: 'RU' }).click()

    await expect(page.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('link', { name: 'Главная' })).toBeVisible()
  })

  test('frequency toggle works for builtin program', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: '2× / week' }).click()
    await expect(page.getByRole('button', { name: '2× / week' })).toHaveAttribute('aria-pressed', 'true')
  })

  // F1: 14 theme palettes available
  test('palette select offers P01 through P14', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    const options = page.locator('#palette-select option')
    await expect(options).toHaveCount(14)
  })

  // F2: system theme mode
  test('system theme mode can be selected', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'System' }).click()
    await expect(page.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true')
  })

  // F4: notify toggle
  test('rest notify toggle works', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    const notify = page.getByRole('button', { name: 'Notify' })
    await notify.click()
    await expect(notify).toHaveAttribute('aria-pressed', 'true')
  })

  // F3: reset all data with confirmation
  test('reset all clears progress and returns to onboarding', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: /reset all data/i }).click()
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
    await expect(page).toHaveURL(/\/onboarding/)
  })
})
