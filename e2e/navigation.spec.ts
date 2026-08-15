import { test, expect } from '@playwright/test'
import { prepareSeededApp, prepareFreshApp, todayLocal } from './helpers/app'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('tab bar routes work', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)

    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page).toHaveURL(/\/stats/)

    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/\/pullup-trainer\/?$/)
  })

  test('about back returns to previous screen', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)

    await page.getByRole('link', { name: 'About' }).scrollIntoViewIfNeeded()
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about/)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/settings/)
  })
})

test.describe('PWA modal', () => {
  test.beforeEach(async ({ page }) => {
    await prepareFreshApp(page)
  })

  test('can dismiss and use app', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
  })
})
