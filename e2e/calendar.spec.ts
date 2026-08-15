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

  test('legend today dot stays small', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    const dot = page.locator('.legend .dot.today')
    await expect(dot).toBeVisible()
    const box = await dot.boundingBox()
    expect(box?.height ?? 99).toBeLessThan(16)
    expect(box?.width ?? 99).toBeLessThan(16)
  })

  test('move stays disabled when date unchanged', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()

    await expect(page.getByRole('button', { name: 'Move' })).toBeDisabled()
  })
})
