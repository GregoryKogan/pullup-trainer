import { test, expect } from '@playwright/test'
import { prepareFreshApp, prepareSeededApp, dismissPwaModal, todayLocal } from './helpers/app'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('tab bar routes work', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)

    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page).toHaveURL(/\/stats/)

    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/\/pullup-trainer\/?$/)
  })

  test('about opens scrolled to top from settings', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)

    await page.locator('.app-main').evaluate((el) => {
      el.scrollTop = 400
    })

    await page.getByRole('link', { name: 'About' }).scrollIntoViewIfNeeded()
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about/)

    await expect
      .poll(async () => page.locator('.app-main').evaluate((el) => el.scrollTop))
      .toBe(0)
  })

  test('about back returns to previous screen', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)

    await page.getByRole('link', { name: 'About' }).scrollIntoViewIfNeeded()
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about/)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/settings/)
  })

  test('RU locale shows translated start on home', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'RU' }).click()
    await page.getByRole('link', { name: 'Главная' }).click()
    await expect(page.getByRole('button', { name: 'Начать' })).toBeVisible()
  })
})

test.describe('PWA modal', () => {
  test.beforeEach(async ({ page }) => {
    await prepareFreshApp(page)
  })

  test('can dismiss and use app', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
  })

  test('stays dismissed during in-app navigation', async ({ page }) => {
    await dismissPwaModal(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('#onboarding-reps').fill('7')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Start program' }).click()

    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Calendar' }).click()
    await expect(page.getByRole('button', { name: /continue in browser|продолжить/i })).toHaveCount(0)
  })
})
