import { test, expect } from '@playwright/test'
import { dismissPwaModal, prepareFreshApp } from './helpers/app'

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
