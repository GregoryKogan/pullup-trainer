import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('Programs', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('create program opens editor', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('link', { name: /custom programs|свои программы/i }).click()

    await page.getByRole('button', { name: /new program|новая программа/i }).click()
    await expect(page).toHaveURL(/\/programs\/\d+\/edit/)

    await page.getByRole('link', { name: /back|назад/i }).click()
    await expect(page).toHaveURL(/\/programs/)
  })
})
