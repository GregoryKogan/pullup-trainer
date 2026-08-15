import { test, expect, type Page } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

async function clearRestGate(page: Page) {
  const skip = page.getByRole('button', { name: /skip|пропуск/i })
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
  }
}

async function completeWorkout(page: Page) {
  const start = page.getByRole('button', { name: 'Start' })
  if (await start.isVisible().catch(() => false)) {
    await start.click()
  } else {
    await page.goto(`/workout/${todayLocal()}`)
  }
  await clearRestGate(page)

  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /done — \d+ reps/i }).click()
    await clearRestGate(page)
  }

  await page.locator('#max-done-input').fill('8')
  await page.getByRole('button', { name: 'Done' }).click()
}

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
})
