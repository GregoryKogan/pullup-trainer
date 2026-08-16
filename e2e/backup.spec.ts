import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'

function buildBackup(anchor: number, today: string) {
  return {
    format: 'pullup-trainer.backup',
    schemaVersion: 3,
    exportedAt: `${today}T12:00:00+03:00`,
    appVersion: '1.0.0',
    settings: {
      id: 'singleton',
      palette: 'p01-volt',
      themeMode: 'system',
      restDurationSeconds: 180,
      restAutoStart: false,
      restVibrate: false,
      restNotify: false,
      language: 'en',
    },
    activeProgress: {
      frequencyDays: 3,
      weekdays: ['mon', 'wed', 'fri'],
      schedule: [{ date: today, stepRef: 1 }],
      lastWorkoutDate: null,
      state: {
        anchor,
        level: 'L2',
        cycleIndex: 0,
        stepInCycle: 1,
        failStreak: 0,
        lastRetestDate: today,
        lastRetestCycleIndex: 0,
        cycleBestMax: 0,
      },
    },
    history: [],
  }
}

test.describe('Backup export/import', () => {
  const today = todayLocal()

  test('export button downloads valid backup file', async ({ page }) => {
    await prepareSeededApp(page, 7, today)
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
    await prepareSeededApp(page, 7, today)

    const backupPath = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-backup-')),
      'pullup-trainer-backup.json',
    )
    fs.writeFileSync(backupPath, JSON.stringify(buildBackup(7, today)))

    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    await page.locator('input[type="file"]').setInputFiles(backupPath)

    await expect(page.getByRole('alertdialog', { name: /restore backup|восстанов/i })).toBeVisible()
    await expect(page.getByText(/replace all local data|заменить все локальные/i)).toBeVisible()
  })
})
