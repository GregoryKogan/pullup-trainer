import { test, expect } from '@playwright/test'
import { addDays, dismissPwaModal, prepareFreshApp, readProgress, todayLocal } from './helpers/app'

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await prepareFreshApp(page)
    await dismissPwaModal(page)
  })

  test('completes test and lands on home', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()

    await page.locator('#onboarding-reps').fill('7')
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('button', { name: 'Start program' })).toBeVisible()
    await page.getByRole('button', { name: 'Start program' }).click()
    await dismissPwaModal(page)

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expect(page.getByText(/base|level|your level/i)).toBeVisible()
  })

  // The max test is a set to failure, so the test day gets no workout.
  test('leaves the test day free and rests before the first workout', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('#onboarding-reps').fill('7')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Start program' }).click()
    await dismissPwaModal(page)

    await expect(page.getByRole('button', { name: /^start$/i })).toHaveCount(0)
    await expect(page.getByText(/max test done/i)).toBeVisible()

    const today = todayLocal()
    const progress = (await readProgress(page)) as {
      lastWorkoutDate: string
      schedule: { date: string }[]
    }
    expect(progress.lastWorkoutDate).toBe(today)
    expect(progress.schedule[0].date >= addDays(today, 2)).toBe(true)
  })

  test('shows not-ready message for zero pull-ups link', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: /can't do a pull-up yet/i }).click()

    await expect(page.getByText('Not ready yet')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start program' })).not.toBeVisible()
  })

  test('defaults to minimum 1 rep', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()

    const input = page.locator('#onboarding-reps')
    await expect(input).toHaveValue('1')
    await expect(page.getByRole('button', { name: /decrease reps/i })).toBeDisabled()
  })

  // B4: user can override recommended max before starting program
  test('override lets user re-enter max before start', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('#onboarding-reps').fill('5')
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByRole('button', { name: 'Change max' }).click()
    await page.locator('#onboarding-reps').fill('9')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Start program' }).click()
    await dismissPwaModal(page)

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  })
})
