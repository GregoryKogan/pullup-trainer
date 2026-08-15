import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('Calendar', () => {
  const today = todayLocal()

  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, today)
  })

  test('opens sheet for scheduled day', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)

    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()

    await expect(page.getByRole('button', { name: 'Start now' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible()
  })

  test('shows hint for unscheduled day', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    await page.getByRole('button', { name: '16' }).click()

    await expect(page.getByText(/no workout planned|не запланирована/i)).toBeVisible()
  })
})
