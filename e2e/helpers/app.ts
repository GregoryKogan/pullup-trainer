import { expect, type Page } from '@playwright/test'

const DB_NAME = 'PullupTrainer'

export interface SeedState {
  anchor?: number
  level?: string
  cycleIndex?: number
  stepInCycle?: number
  failStreak?: number
  lastRetestDate?: string | null
  lastRetestCycleIndex?: number
  cycleBestMax?: number
}

export interface SeedWorkoutRecord {
  date: string
  result: 'success' | 'fail'
  stepInCycle?: number
  kind?: 'workout' | 'test'
  totals?: { volumeReps: number; maxSetReps: number }
  sets?: { position: number; type: string; planned: number; done: number }[]
}

export interface SeedOptions {
  anchor?: number
  today?: string
  stepRef?: number
  schedule?: { date: string; stepRef: number }[]
  lastWorkoutDate?: string | null
  frequencyDays?: 2 | 3
  weekdays?: string[]
  state?: SeedState
  language?: 'en' | 'ru'
  palette?: string
  themeMode?: 'dark' | 'light' | 'system'
  restDurationSeconds?: number
  restAutoStart?: boolean
  workoutRecords?: SeedWorkoutRecord[]
}

async function withOrigin(page: Page) {
  const url = page.url()
  if (!url.includes('127.0.0.1:4173') && !url.includes('localhost:4173')) {
    await page.goto('.')
  }
}

function levelFromAnchor(anchor: number): string {
  if (anchor >= 20) return 'L4'
  if (anchor >= 10) return 'L3'
  if (anchor >= 5) return 'L2'
  return 'L1'
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

export async function seedActiveWorkoutSession(page: Page, date: string) {
  await startWorkout(page, date)
  await expect(page.locator('.top-progress')).toContainText(/set|подход/i)
  await page.evaluate(() => {
    const root = document.querySelector('#app') as HTMLElement & {
      __vue_app__?: { _context: { provides: Record<string | symbol, unknown> } }
    }
    const app = root?.__vue_app__
    if (!app) throw new Error('Vue app not found')

    for (const key of Object.getOwnPropertySymbols(app._context.provides)) {
      const candidate = app._context.provides[key]
      if (
        candidate &&
        typeof candidate === 'object' &&
        'push' in candidate &&
        'currentRoute' in candidate
      ) {
        ;(candidate as { push: (to: { name: string }) => Promise<void> }).push({ name: 'calendar' })
        return
      }
    }
    throw new Error('Router not found')
  })
  await page.waitForURL(/\/calendar/)
  await dismissPwaModal(page)
}

export async function startWorkout(page: Page, date?: string) {
  const start = page.getByRole('button', { name: /^start$|^начать$|^start now$/i })
  if (await start.isVisible().catch(() => false)) {
    await start.click()
  } else {
    await page.goto(`workout/${date ?? todayLocal()}`)
  }
  await page.waitForURL(/\/workout\//)
  // A goto fallback is a full page load, which brings the install modal back.
  await dismissPwaModal(page)
  await clearRestGate(page)
}

export async function completeWorkout(page: Page, maxReps = '8') {
  await startWorkout(page)

  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /^done$|^готово$/i }).click()
    await clearRestGate(page)
  }

  await page.locator('#max-done-input').fill(maxReps)
  await page.getByRole('button', { name: /^done$|^готово$/i }).click()
  await expect(page).toHaveURL(/\/result/)
}

export async function failWorkoutEarly(page: Page) {
  await startWorkout(page)
  const strayDialog = page.getByRole('alertdialog')
  if (await strayDialog.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /^cancel$|^отмена$/i }).click()
  }
  await page.getByRole('button', { name: /leave workout|выйти из тренировки/i }).click()
  await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
  await expect(page).toHaveURL(/\/result/)
}

export async function failWorkoutFinalShort(page: Page, maxReps: string) {
  await startWorkout(page)
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /^done$|^готово$/i }).click()
    await clearRestGate(page)
  }
  await page.locator('#max-done-input').fill(maxReps)
  await page.locator('.max-done').getByRole('button', { name: /^done$|^готово$/i }).click()
}

export async function assertSetTargets(page: Page, targets: number[]) {
  const cards = page.locator('.setsrow .s b')
  await expect(cards).toHaveCount(targets.length)
  for (let i = 0; i < targets.length; i++) {
    await expect(cards.nth(i)).toHaveText(String(targets[i]))
  }
}

export async function readProgress(page: Page) {
  await withOrigin(page)
  return page.evaluate(async (dbName) => {
    return new Promise<Record<string, unknown> | null>((resolve, reject) => {
      const req = indexedDB.open(dbName)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('activeProgress', 'readonly')
        const get = tx.objectStore('activeProgress').get('singleton')
        get.onsuccess = () => {
          db.close()
          resolve((get.result as { data?: Record<string, unknown> } | undefined)?.data ?? null)
        }
        get.onerror = () => reject(get.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, DB_NAME)
}

export async function readRecords(page: Page) {
  await withOrigin(page)
  return page.evaluate(async (dbName) => {
    return new Promise<unknown[]>((resolve, reject) => {
      const req = indexedDB.open(dbName)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('workoutRecords', 'readonly')
        const getAll = tx.objectStore('workoutRecords').getAll()
        getAll.onsuccess = () => {
          db.close()
          resolve(getAll.result ?? [])
        }
        getAll.onerror = () => reject(getAll.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, DB_NAME)
}

export async function resetApp(page: Page) {
  await page.goto('.')
  await clearAppState(page)
  await page.reload()
  await dismissPwaModal(page)
}

export async function seedBuiltinProgress(page: Page, anchor: number, today: string) {
  await seedProgress(page, { anchor, today, stepRef: 1 })
}

export async function seedProgress(page: Page, options: SeedOptions = {}) {
  const today = options.today ?? todayLocal()
  const anchor = options.anchor ?? 7
  const stepRef = options.stepRef ?? options.state?.stepInCycle ?? 1
  const state = {
    anchor,
    level: options.state?.level ?? levelFromAnchor(anchor),
    cycleIndex: options.state?.cycleIndex ?? 0,
    stepInCycle: options.state?.stepInCycle ?? stepRef,
    failStreak: options.state?.failStreak ?? 0,
    lastRetestDate: options.state?.lastRetestDate ?? today,
    lastRetestCycleIndex: options.state?.lastRetestCycleIndex ?? 0,
    cycleBestMax: options.state?.cycleBestMax ?? 0,
  }

  await withOrigin(page)
  await page.evaluate(
    async ({ dbName, payload }) => {
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
            palette: payload.palette,
            themeMode: payload.themeMode,
            restDurationSeconds: payload.restDurationSeconds,
            restAutoStart: payload.restAutoStart,
            restNotify: false,
            language: payload.language,
          })
          tx.objectStore('activeProgress').put({
            id: 'singleton',
            data: {
              frequencyDays: payload.frequencyDays,
              weekdays: payload.weekdays,
              schedule: payload.schedule,
              lastWorkoutDate: payload.lastWorkoutDate,
              state: payload.state,
            },
          })
          tx.objectStore('appMeta').put({
            id: 'singleton',
            appVersion: '1.0.0',
            schemaVersion: 4,
          })
          tx.objectStore('workoutRecords').clear()
          for (const rec of payload.workoutRecords) {
            const totals = rec.totals ?? { volumeReps: 0, maxSetReps: 0 }
            tx.objectStore('workoutRecords').add({
              date: rec.date,
              startedAt: `${rec.date}T10:00:00+03:00`,
              finishedAt: `${rec.date}T10:30:00+03:00`,
              durationSeconds: 1800,
              kind: rec.kind ?? 'workout',
              program: 'builtin',
              programName: 'Pull-up Trainer',
              context: {
                level: 'L2',
                anchor: payload.state.anchor,
                cycleIndex: payload.state.cycleIndex,
                stepInCycle: rec.stepInCycle ?? payload.state.stepInCycle,
              },
              result: rec.result,
              sets: rec.sets ?? [],
              totals: {
                volumeReps: totals.volumeReps,
                maxSetReps: totals.maxSetReps,
              },
            })
          }
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    },
    {
      dbName: DB_NAME,
      payload: {
        palette: options.palette ?? 'p01-volt',
        themeMode: options.themeMode ?? 'system',
        restDurationSeconds: options.restDurationSeconds ?? 180,
        restAutoStart: options.restAutoStart ?? false,
        language: options.language ?? 'en',
        frequencyDays: options.frequencyDays ?? 3,
        weekdays: options.weekdays ?? ['mon', 'wed', 'fri'],
        schedule: options.schedule ?? [{ date: today, stepRef }],
        lastWorkoutDate: options.lastWorkoutDate ?? null,
        state,
        workoutRecords: options.workoutRecords ?? [],
      },
    },
  )
}

export async function gotoApp(page: Page, path = '') {
  const target = path ? (path.startsWith('/') ? path.slice(1) : path) : '.'
  await page.goto(target)
  await dismissPwaModal(page)
}

export async function prepareFreshApp(page: Page) {
  await resetApp(page)
}

export async function prepareFreshAppKeepPwa(page: Page) {
  await page.goto('.')
  await clearAppState(page)
  await page.reload()
}

export async function prepareSeededApp(page: Page, anchor: number, today: string) {
  await resetApp(page)
  await seedBuiltinProgress(page, anchor, today)
  await page.reload({ waitUntil: 'networkidle' })
  await dismissPwaModal(page)
  await expectHomeReady(page)
}

export async function prepareProgress(page: Page, options: SeedOptions = {}) {
  await resetApp(page)
  await seedProgress(page, options)
  await page.reload({ waitUntil: 'networkidle' })
  await dismissPwaModal(page)
  await expectHomeReady(page)
}

async function expectHomeReady(page: Page) {
  await page.goto('.')
  await dismissPwaModal(page)
  const nav = page.getByRole('navigation', { name: /main navigation|основная навигация/i })
  await nav.waitFor({ state: 'visible', timeout: 15_000 })
}

// Resolved once per worker process. A run that crosses midnight would
// otherwise seed one date and assert against the next.
const RUN_DATE = (() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})()

export function todayLocal(): string {
  return RUN_DATE
}

/**
 * Pins the page clock to midday on `date` (the run date by default) so the app
 * and the seeded schedule agree on what "today" is.
 *
 * Date.now() stops moving, so do NOT use this in specs that assert on elapsed
 * time or the rest timer. Call it before prepareProgress / prepareSeededApp.
 */
export async function freezeToday(page: Page, date: string = RUN_DATE) {
  await page.clock.setFixedTime(new Date(`${date}T12:00:00`))
}

export function addDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function startOfWeek(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function buildStatsHistory(today: string, count: number): SeedWorkoutRecord[] {
  const records: SeedWorkoutRecord[] = []
  let date = today
  for (let i = 0; i < count; i++) {
    const maxSetReps = 5 + (i % 11)
    const volumeReps = 30 + (i % 31)
    records.push({
      date,
      result: 'success',
      totals: { volumeReps, maxSetReps },
    })
    date = addDays(date, -(2 + (i % 2)))
  }
  return records
}

export async function assertNoTextOverlap(
  page: Page,
  chartIndex: number,
  selector: string,
) {
  const chart = page.locator('.chart-wrap svg.chart').nth(chartIndex)
  await expect(chart).toBeVisible()
  const overlap = await chart.evaluate((svg, sel) => {
    const els = [...svg.querySelectorAll(sel)]
    const pad = 2
    const boxes = els.map((el) => el.getBoundingClientRect())
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        if (
          a.left - pad < b.right &&
          a.right + pad > b.left &&
          a.top - pad < b.bottom &&
          a.bottom + pad > b.top
        ) {
          return { first: i, second: j }
        }
      }
    }
    return null
  }, selector)
  expect(overlap).toBeNull()
}

export async function seedWorkoutRecord(
  page: Page,
  record: SeedWorkoutRecord & { anchor?: number },
) {
  await withOrigin(page)
  await page.evaluate(
    async ({ dbName, rec }) => {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('workoutRecords', 'readwrite')
          tx.objectStore('workoutRecords').add({
            date: rec.date,
            startedAt: `${rec.date}T10:00:00+03:00`,
            finishedAt: `${rec.date}T10:30:00+03:00`,
            durationSeconds: 1800,
            kind: rec.kind ?? 'workout',
            program: 'builtin',
            programName: 'Pull-up Trainer',
            context: {
              level: 'L2',
              anchor: rec.anchor ?? 7,
              cycleIndex: 0,
              stepInCycle: rec.stepInCycle ?? 1,
            },
            result: rec.result,
            sets: rec.sets ?? [],
            totals: {
              volumeReps: rec.totals?.volumeReps ?? 0,
              maxSetReps: rec.totals?.maxSetReps ?? 0,
            },
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
    { dbName: DB_NAME, rec: record },
  )
}

export async function setLanguageRu(page: Page) {
  await withOrigin(page)
  await page.evaluate(async (dbName) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(dbName)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('settings', 'readwrite')
        const store = tx.objectStore('settings')
        const get = store.get('singleton')
        get.onsuccess = () => {
          const row = get.result ?? { id: 'singleton' }
          store.put({ ...row, id: 'singleton', language: 'ru' })
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, DB_NAME)
}
