import { test, expect, type Page } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

async function enterWorkout(page: Page) {
  const start = page.getByRole('button', { name: 'Start' })
  if (await start.isVisible().catch(() => false)) {
    await start.click()
  } else {
    await page.goto(`/workout/${todayLocal()}`)
  }
  await clearRestGate(page)
}

async function clearRestGate(page: Page) {
  const skip = page.getByRole('button', { name: /skip|пропуск/i })
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
  }
}

async function skipRestIfNeeded(page: Page) {
  await clearRestGate(page)
}

test.describe('Workout', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('completes all sets and shows result', async ({ page }) => {
    await enterWorkout(page)

    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /done — \d+ reps/i }).click()
      await skipRestIfNeeded(page)
    }

    await page.locator('#max-done-input').fill('8')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.locator('.status-kicker')).toContainText(/workout complete|workout incomplete/i)
  })
})
