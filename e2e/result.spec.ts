import { test, expect } from '@playwright/test'
import { prepareSeededApp, completeWorkout, clearRestGate, dismissPwaModal, todayLocal } from './helpers/app'

test.describe('Result', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('success navigates home', async ({ page }) => {
    await completeWorkout(page)

    await expect(page.locator('.status-kicker')).toContainText(/workout complete|тренировка выполнена/i)
    await page.getByRole('button', { name: /home|главная/i }).click()
    await expect(page.getByRole('navigation', { name: /main navigation|основная навигация/i })).toBeVisible()
  })

  test('fail shows try again', async ({ page }) => {
    await page.getByRole('button', { name: 'Start' }).click()
    await clearRestGate(page)

    await page.getByRole('button', { name: /different number|другое число/i }).click()
    await page.locator('#fewer-input').fill('2')
    await page.getByRole('button', { name: 'Confirm' }).click()
    await clearRestGate(page)

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /done — \d+ reps/i }).click()
      await clearRestGate(page)
    }

    await page.locator('#max-done-input').fill('4')
    await page.getByRole('button', { name: 'Done' }).click()

    await expect(page.locator('.status-kicker')).toContainText(/incomplete|не завершена/i)
    await expect(page.getByRole('button', { name: /try again|попробовать снова/i })).toBeVisible()
  })

  test('redirects home without result context', async ({ page }) => {
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.goto('result')
    await expect(page).toHaveURL(/\/pullup-trainer\/?$/)
  })
})
