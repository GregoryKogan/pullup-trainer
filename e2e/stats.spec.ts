import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

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

  test('export history downloads valid JSON', async ({ page }) => {
    await page.getByRole('link', { name: 'Stats' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export history json|экспорт истории json/i }).click()
    const download = await downloadPromise

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-history-'))
    const historyPath = path.join(tmpDir, 'pullup-trainer-history.json')
    await download.saveAs(historyPath)

    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf8')) as {
      format?: string
      records?: unknown[]
    }
    expect(raw.format).toBe('pullup-trainer.history')
    expect(Array.isArray(raw.records)).toBe(true)
  })
})
