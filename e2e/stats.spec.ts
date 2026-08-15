import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

test.describe('Stats', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
  })

  test('shows stats page with export and empty chart hint', async ({ page }) => {
    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page).toHaveURL(/\/stats/)
    await expect(page.getByRole('heading', { name: /stats|статистика/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /export history json|экспорт истории json/i })).toBeVisible()
    await expect(page.getByText(/complete more workouts|сделай больше тренировок/i).first()).toBeVisible()
  })
})
