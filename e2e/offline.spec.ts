import { test, expect } from '@playwright/test'
import { prepareSeededApp, completeWorkout, readProgress, todayLocal, dismissPwaModal } from './helpers/app'

test.describe('Offline persistence', () => {
  test('progress survives page reload', async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
    await completeWorkout(page, '8')
    await page.reload()
    await dismissPwaModal(page)
    await page.getByRole('link', { name: 'Stats' }).click()
    await expect(page.locator('.hist li').first()).toBeVisible()

    const progress = await readProgress(page)
    expect(progress?.state?.stepInCycle).toBeGreaterThan(1)
  })

  test('history export works after reload', async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
    await completeWorkout(page, '8')
    await page.reload()
    await dismissPwaModal(page)
    await page.getByRole('link', { name: 'Stats' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export history json|экспорт истории json/i }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('pullup-trainer-history.json')
  })
})
