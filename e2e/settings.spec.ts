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

  test('links to custom programs', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('link', { name: /custom programs|свои программы/i }).click()
    await expect(page).toHaveURL(/\/programs/)
    await expect(page.getByRole('button', { name: /new program|новая программа/i })).toBeVisible()
  })

  test('frequency toggle works for builtin program', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: '2× / week' }).click()
    await expect(page.getByRole('button', { name: '2× / week' })).toHaveAttribute('aria-pressed', 'true')
  })
})
