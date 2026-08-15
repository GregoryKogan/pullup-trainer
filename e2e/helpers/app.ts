import type { Page } from '@playwright/test'

const DB_NAME = 'PullupTrainer'

async function withOrigin(page: Page) {
  const url = page.url()
  if (!url.includes('127.0.0.1:4173') && !url.includes('localhost:4173')) {
    await page.goto('/')
  }
}

export async function clearAppState(page: Page) {
  await withOrigin(page)
  await page.evaluate(async (dbName) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
    sessionStorage.clear()
  }, DB_NAME)
}

export async function dismissPwaModal(page: Page) {
  const dismiss = page.getByRole('button', { name: /continue in browser|продолжить/i })
  try {
    await dismiss.waitFor({ state: 'visible', timeout: 4000 })
    await dismiss.click()
    await dismiss.waitFor({ state: 'hidden', timeout: 4000 })
  } catch {
    // modal not shown
  }
}

export async function clearRestGate(page: Page) {
  const skip = page.getByRole('button', { name: /skip|пропуск/i })
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
  }
}

export async function completeWorkout(page: Page, maxReps = '8') {
  const start = page.getByRole('button', { name: /^start$|^начать$/i })
  if (await start.isVisible().catch(() => false)) {
    await start.click()
  } else {
    await page.goto(`/workout/${todayLocal()}`)
  }
  await clearRestGate(page)

  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /^done$|^готово$/i }).click()
    await clearRestGate(page)
  }

  await page.locator('#max-done-input').fill(maxReps)
  await page.getByRole('button', { name: /^done$|^готово$/i }).click()
}

export async function resetApp(page: Page) {
  await page.goto('/')
  await clearAppState(page)
  await page.reload()
  await dismissPwaModal(page)
}

export async function seedBuiltinProgress(page: Page, anchor: number, today: string) {
  await withOrigin(page)
  await page.evaluate(
    async ({ dbName, anchor, today }) => {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(
            ['settings', 'activeProgress', 'workoutRecords', 'appMeta'],
            'readwrite',
          )
          tx.objectStore('settings').put({
            id: 'singleton',
            palette: 'p01-volt',
            themeMode: 'system',
            restDurationSeconds: 180,
            restAutoStart: false,
            restVibrate: false,
            restNotify: false,
            language: 'en',
          })
          tx.objectStore('activeProgress').put({
            id: 'singleton',
            data: {
              source: 'builtin',
              frequencyDays: 3,
              weekdays: ['mon', 'wed', 'fri'],
              schedule: [{ date: today, stepRef: 1 }],
              lastWorkoutDate: null,
              state: {
                path: 'L',
                anchor,
                level: anchor >= 20 ? 'L4' : anchor >= 10 ? 'L3' : anchor >= 5 ? 'L2' : 'L1',
                cycleIndex: 0,
                stepInCycle: 1,
                failStreak: 0,
                lastRetestDate: today,
                cycleBestMax: 0,
              },
            },
          })
          tx.objectStore('appMeta').put({
            id: 'singleton',
            appVersion: '1.0.0',
            schemaVersion: 1,
            builtinSeedVersion: 1,
          })
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    },
    { dbName: DB_NAME, anchor, today },
  )
}

export async function gotoApp(page: Page, path = '/') {
  await page.goto(path)
  await dismissPwaModal(page)
}

export async function prepareFreshApp(page: Page) {
  await resetApp(page)
}

export async function seedPath0Progress(page: Page, today: string) {
  await withOrigin(page)
  await page.evaluate(
    async ({ dbName, today }) => {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(['settings', 'activeProgress', 'workoutRecords', 'appMeta'], 'readwrite')
          tx.objectStore('settings').put({
            id: 'singleton',
            palette: 'p01-volt',
            themeMode: 'system',
            restDurationSeconds: 180,
            restAutoStart: false,
            restVibrate: false,
            restNotify: false,
            language: 'en',
          })
          tx.objectStore('activeProgress').put({
            id: 'singleton',
            data: {
              source: 'builtin',
              frequencyDays: 3,
              weekdays: ['mon', 'wed', 'fri'],
              schedule: [{ date: today, stepRef: 1 }],
              lastWorkoutDate: null,
              state: { path: 'P0', path0Step: 1, failStreak: 0 },
            },
          })
          tx.objectStore('appMeta').put({
            id: 'singleton',
            appVersion: '1.0.0',
            schemaVersion: 1,
            builtinSeedVersion: 1,
          })
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    },
    { dbName: DB_NAME, today },
  )
}

export async function seedCustomProgress(page: Page, today: string, restDaysAfter = 3) {
  await withOrigin(page)
  await page.evaluate(
    async ({ dbName, today, restDaysAfter }) => {
      function addDays(iso: string, n: number) {
        const [y, m, d] = iso.split('-').map(Number)
        const dt = new Date(y, m - 1, d)
        dt.setDate(dt.getDate() + n)
        const yy = dt.getFullYear()
        const mm = String(dt.getMonth() + 1).padStart(2, '0')
        const dd = String(dt.getDate()).padStart(2, '0')
        return `${yy}-${mm}-${dd}`
      }
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction(
            ['settings', 'customPrograms', 'activeProgress', 'workoutRecords', 'appMeta'],
            'readwrite',
          )
          tx.objectStore('settings').put({
            id: 'singleton',
            palette: 'p01-volt',
            themeMode: 'system',
            restDurationSeconds: 180,
            restAutoStart: false,
            restVibrate: false,
            restNotify: false,
            language: 'en',
          })
          tx.objectStore('customPrograms').put({
            id: 1,
            name: 'Test Program',
            steps: [
              {
                sets: [{ position: 1, type: 'reps', unit: 'reps', planned: 5 }],
                restDaysAfter,
              },
              { sets: [{ position: 1, type: 'reps', unit: 'reps', planned: 8 }] },
            ],
          })
          tx.objectStore('activeProgress').put({
            id: 'singleton',
            data: {
              source: 'custom',
              customProgramId: 1,
              currentStepIndex: 0,
              failStreak: 0,
              schedule: [
                { date: today, stepRef: 0 },
                { date: addDays(today, restDaysAfter), stepRef: 1 },
              ],
              lastWorkoutDate: null,
            },
          })
          tx.objectStore('appMeta').put({
            id: 'singleton',
            appVersion: '1.0.0',
            schemaVersion: 1,
            builtinSeedVersion: 1,
          })
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    },
    { dbName: DB_NAME, today, restDaysAfter },
  )
}

export async function preparePath0App(page: Page, today: string) {
  await resetApp(page)
  await seedPath0Progress(page, today)
  await page.reload({ waitUntil: 'networkidle' })
  await dismissPwaModal(page)
  await expectHomeReady(page)
}

export async function prepareCustomApp(page: Page, today: string, restDaysAfter = 3) {
  await resetApp(page)
  await seedCustomProgress(page, today, restDaysAfter)
  await page.reload({ waitUntil: 'networkidle' })
  await dismissPwaModal(page)
  await expectHomeReady(page)
}

export async function prepareSeededApp(page: Page, anchor: number, today: string) {
  await resetApp(page)
  await seedBuiltinProgress(page, anchor, today)
  await page.reload({ waitUntil: 'networkidle' })
  await dismissPwaModal(page)
  await expectHomeReady(page)
}

async function expectHomeReady(page: Page) {
  await page.goto('/')
  await dismissPwaModal(page)
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await nav.waitFor({ state: 'visible', timeout: 15_000 })
}

export function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
