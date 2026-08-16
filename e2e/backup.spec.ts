import { test, expect } from '@playwright/test'
import { prepareProgress, readProgress, todayLocal } from './helpers/app'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

test.describe('Backup export/import', () => {
  const today = todayLocal()

  test('export button downloads valid backup file', async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today })
    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export backup|экспорт бэкапа/i }).click()
    const download = await downloadPromise

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-backup-'))
    const backupPath = path.join(tmpDir, 'pullup-trainer-backup.json')
    await download.saveAs(backupPath)

    const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as {
      format?: string
      activeProgress?: { state?: { anchor?: number } }
    }
    expect(raw.format).toBe('pullup-trainer.backup')
    expect(raw.activeProgress?.state?.anchor).toBe(7)
  })

  test('import backup opens restore confirm dialog', async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today })

    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export backup|экспорт бэкапа/i }).click()
    const download = await downloadPromise
    const backupPath = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-backup-')),
      'pullup-trainer-backup.json',
    )
    await download.saveAs(backupPath)

    await page.locator('input[type="file"]').setInputFiles(backupPath)

    await expect(page.getByRole('alertdialog', { name: /restore backup|восстанов/i })).toBeVisible()
    await expect(page.getByText(/replace all local data|заменить все локальные/i)).toBeVisible()
  })

  test('confirm import restores progress from backup file', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 12,
      today,
      state: { stepInCycle: 3, cycleIndex: 1 },
    })
    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export backup|экспорт бэкапа/i }).click()
    const download = await downloadPromise
    const backupPath = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-backup-')),
      'pullup-trainer-backup.json',
    )
    await download.saveAs(backupPath)

    const exported = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as {
      activeProgress?: { state?: { anchor?: number } }
    }
    expect(exported.activeProgress?.state?.anchor).toBe(12)

    await prepareProgress(page, { anchor: 7, today })
    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    await page.locator('input[type="file"]').setInputFiles(backupPath)
    await expect(page.getByRole('alertdialog', { name: /restore backup|восстанов/i })).toBeVisible()
    await page.getByRole('alertdialog', { name: /restore backup|восстанов/i }).getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()

    const progress = await readProgress(page)
    const state = progress?.state as { anchor: number; stepInCycle: number; cycleIndex: number }
    expect(state.anchor).toBe(12)
    expect(state.stepInCycle).toBe(3)
    expect(state.cycleIndex).toBe(1)
  })
})
