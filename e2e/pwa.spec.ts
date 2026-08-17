import { test, expect } from '@playwright/test'
import { prepareFreshAppKeepPwa, dismissPwaModal } from './helpers/app'

test.describe('PWA install screen', () => {
  test.beforeEach(async ({ page }) => {
    await prepareFreshAppKeepPwa(page)
  })

  // I1/I2: modal with platform tabs and step instructions
  test('shows install modal with platform tabs and steps', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.kicker')).toHaveText('Install Pull-up Trainer')
    await expect(dialog.getByRole('heading', { name: /works offline/i })).toBeVisible()
    await expect(dialog.getByRole('tab', { name: 'iOS' })).toBeVisible()
    await expect(dialog.getByRole('tab', { name: 'Android' })).toBeVisible()
    await expect(dialog.getByRole('tab', { name: 'Desktop' })).toBeVisible()

    await dialog.getByRole('tab', { name: 'iOS' }).click()
    await expect(dialog.getByText('Tap Share')).toBeVisible()

    await dialog.getByRole('tab', { name: 'Android' }).click()
    await expect(dialog.getByText(/install app or add to home screen/i)).toBeVisible()
  })

  // I3: modal reappears after reload
  test('reappears after page reload', async ({ page }) => {
    await dismissPwaModal(page)
    await page.reload()
    await expect(page.getByRole('button', { name: /continue in browser/i })).toBeVisible()
  })

  // J2: RU install instructions
  test('RU locale shows translated install steps', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'RU' }).click()
    await expect(dialog.locator('.kicker')).toHaveText('Установи Pull-up Trainer')
    await expect(dialog.getByRole('button', { name: /продолжить/i })).toBeVisible()
    await dialog.getByRole('tab', { name: 'iOS' }).click()
    await expect(dialog.getByText('Нажми Поделиться')).toBeVisible()
  })

  test('exposes PWA branding meta tags and manifest link', async ({ page }) => {
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      'content',
      'Pull-ups',
    )
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'Pull-ups')
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
  })
})
