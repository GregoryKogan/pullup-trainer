import { test, expect } from '@playwright/test'
import { prepareSeededApp, startWorkout, todayLocal } from './helpers/app'

test.describe('Rest timer', () => {
  const today = todayLocal()

  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, today)
  })

  test('settings default is 3:00 with presets', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page.getByRole('button', { name: '3:00', pressed: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '1:30' })).toBeVisible()
    await expect(page.getByRole('button', { name: '5:00' })).toBeVisible()
  })

  test('settings ±15s changes displayed duration', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: /increase rest|увеличить время/i }).click()
    await expect(page.locator('.setrow .v b').first()).toHaveText('3:15')
  })

  test('in-workout rest ring shows configured duration', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: '1:30' }).click()
    await page.getByRole('button', { name: /auto.?start/i }).click()

    await page.getByRole('navigation').getByRole('link', { name: 'Home' }).click()
    await startWorkout(page)
    await page.getByRole('button', { name: /^done$|^готово$/i }).click()

    await expect(page.locator('.ring-num')).toHaveText('1:30', { timeout: 10_000 })
  })
})
