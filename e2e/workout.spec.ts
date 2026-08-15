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
      await page.getByRole('button', { name: /done — \d+ reps/i }).click()
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
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
    await expect(page.locator('.status-kicker')).toContainText(/incomplete|не завершена/i)
  })
})
