import { test, expect } from '@playwright/test'
import { prepareSeededApp, prepareCustomApp, todayLocal } from './helpers/app'

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

  test('custom schedule respects rest days between steps', async ({ page }) => {
    const today = todayLocal()
    await prepareCustomApp(page, today, 4)

    await expect(page.getByText(/plan: 5/i)).toBeVisible()

    const nextDate = await page.evaluate((todayIso) => {
      const [y, m, d] = todayIso.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      dt.setDate(dt.getDate() + 4)
      const yy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      return `${yy}-${mm}-${dd}`
    }, today)

    await page.getByRole('link', { name: 'Calendar' }).click()
    const nextDay = String(new Date(nextDate).getDate())
    await expect(page.getByRole('button', { name: new RegExp(`${nextDay}, planned`, 'i') })).toBeVisible()
  })
})
