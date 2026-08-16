import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal, clearRestGate } from './helpers/app'

test.describe('Workout', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('completes all sets and shows result', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)

    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /^done$|^готово$/i }).click()
      await clearRestGate(page)
    }

    await page.locator('#max-done-input').fill('8')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.locator('.status-kicker')).toContainText(/workout complete|workout incomplete/i)
  })

  test('exit mid-workout counts as fail', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)
    await page.getByRole('button', { name: /leave workout|выйти из тренировки/i }).click()
    await expect(page.getByRole('alertdialog')).toContainText(/leave workout|выйти/i)
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
    await expect(page.locator('.status-kicker')).toContainText(/incomplete|не завершена/i)
  })

  // C7/C8: progress label and session clock visible during workout
  test('shows set progress and elapsed clock', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)
    await expect(page.locator('.top-progress')).toContainText(/set|подход/i)
    await expect(page.locator('.clock')).toBeVisible()
  })

  test('skip set counts as fail', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)
    await page.getByRole('button', { name: /^skip set$|^пропустить подход$/i }).click()
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
    await expect(page.locator('.status-kicker')).toContainText(/incomplete|не завершена/i)
  })

  test('reschedule navigates to calendar with day sheet', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)
    await page.getByRole('button', { name: /^move workout$|^перенести$/i }).click()
    await expect(page).toHaveURL(/\/calendar/)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible()
  })
})
