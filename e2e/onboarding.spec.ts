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

  test('M=0 lands on starting path', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('#onboarding-reps').fill('0')
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByText(/starting path|beginner path|scap pulls/i)).toBeVisible()
    await page.getByRole('button', { name: 'Start program' }).click()
    await dismissPwaModal(page)

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expect(
      page.getByRole('paragraph').filter({ hasText: /starting path · step 1/i }).first(),
    ).toBeVisible()
  })
})
