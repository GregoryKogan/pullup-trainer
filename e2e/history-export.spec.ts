import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import {
  prepareSeededApp,
  todayLocal,
  completeWorkout,
  readRecords,
  freezeToday,
} from './helpers/app'

test.describe('History export schema', () => {
  test.beforeEach(async ({ page }) => {
    await freezeToday(page)
  })

  const today = todayLocal()

  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, today)
  })

  // C9/G3/G5: workout writes full record; export matches §3.9.2
  test('workout record has sets context and totals', async ({ page }) => {
    await completeWorkout(page, '8')
    await page.getByRole('button', { name: /home|главная/i }).click()

    const records = (await readRecords(page)) as {
      kind: string
      context?: { anchor: number; stepInCycle: number }
      sets: { position: number; planned: number; done: number }[]
      totals: { volumeReps: number; maxSetReps: number }
      result: string
    }[]

    const workout = records.find((r) => r.kind === 'workout')
    expect(workout).toBeTruthy()
    expect(workout!.sets).toHaveLength(5)
    expect(workout!.context?.anchor).toBe(7)
    expect(workout!.totals.volumeReps).toBeGreaterThan(0)
    expect(workout!.result).toBe('success')
  })

  test('exported history JSON includes schema fields', async ({ page }) => {
    await completeWorkout(page, '8')
    await page.getByRole('button', { name: /home|главная/i }).click()
    await page.getByRole('link', { name: 'Stats' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /export history json/i }).click()
    const download = await downloadPromise

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pullup-history-'))
    const historyPath = path.join(tmpDir, 'pullup-trainer-history.json')
    await download.saveAs(historyPath)

    const raw = JSON.parse(fs.readFileSync(historyPath, 'utf8')) as {
      format: string
      schemaVersion: number
      generatedAt: string
      appVersion: string
      records: {
        kind: string
        sets: { position: number; type: string; planned?: number; done: number }[]
        context?: object
        totals: object
      }[]
    }

    expect(raw.format).toBe('pullup-trainer.history')
    expect(typeof raw.schemaVersion).toBe('number')
    expect(raw.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(raw.records.length).toBeGreaterThan(0)

    const rec = raw.records.find((r) => r.kind === 'workout')
    expect(rec?.context).toBeTruthy()
    expect(rec?.sets[4]?.type).toBe('max')
    expect(rec?.totals).toBeTruthy()
  })
})
