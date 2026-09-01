import { test, expect, type Page } from '@playwright/test'
import {
  prepareProgress,
  prepareSeededApp,
  seedWorkoutRecord,
  readProgress,
  dismissPwaModal,
  todayLocal,
  addDays,
  seedActiveWorkoutSession,
  freezeToday,
  dayCellName,
  moveOptionName,
  showCalendarMonth,
} from './helpers/app'

function moveOption(page: Page, name: string) {
  return page.locator('.optrow').getByRole('button', { name, exact: true })
}

test.describe('Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await freezeToday(page)
  })

  const today = todayLocal()

  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, today)
  })

  test('opens sheet for scheduled day', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)

    await page.getByRole('button', { name: dayCellName(today) }).click()

    await expect(page.getByRole('button', { name: 'Start now' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible()
  })

  test('start now navigates to workout', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await page.getByRole('button', { name: dayCellName(today) }).click()
    await page.getByRole('button', { name: /start now|начать/i }).click()
    await expect(page).toHaveURL(/\/workout/)
  })

  test('day history lists completed workout', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [{ date: today, stepRef: 1 }],
      workoutRecords: [{ date: today, result: 'success' }],
    })
    await page.getByRole('link', { name: 'Calendar' }).click()
    await page.getByRole('button', { name: dayCellName(today, 'planned|done') }).click()
    await expect(page.getByText(/day history|история дня/i)).toBeVisible()
    await expect(page.locator('.day-history li').first()).toBeVisible()
  })

  test('shows hint for unscheduled day', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    await page.locator('.calgrid button.day.rest:not(.out)').first().click()

    await expect(page.getByRole('status')).toContainText(/no workout planned|не запланирована/i)
  })

  // The grid fills the page, so anything that changes the height above it
  // rescales every cell. Both the hint and a month label that wraps to a
  // second line used to do exactly that.
  test('day hint does not resize the grid', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    const cell = page.locator('.calgrid button.day').first()
    const before = await cell.boundingBox()

    await page.locator('.calgrid button.day.rest:not(.out)').first().click()
    await expect(page.getByRole('status')).toContainText(/no workout planned|не запланирована/i)

    const after = await cell.boundingBox()
    expect(after?.y).toBeCloseTo(before?.y ?? -1, 1)
    expect(after?.height).toBeCloseTo(before?.height ?? -1, 1)
  })

  test('paging months keeps every cell the same size', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    const cell = page.locator('.calgrid button.day').first()

    for (const width of [393, 320]) {
      await page.setViewportSize({ width, height: 700 })
      const first = await cell.boundingBox()
      for (let i = 0; i < 12; i++) {
        await page.getByRole('button', { name: /next month|следующий месяц/i }).click()
        const box = await cell.boundingBox()
        expect(box?.y).toBeCloseTo(first?.y ?? -1, 1)
        expect(box?.height).toBeCloseTo(first?.height ?? -1, 1)
      }
    }
  })

  test('legend today swatch stays small', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    const swatch = page.locator('.legend .swatch.today')
    await expect(swatch).toBeVisible()
    const box = await swatch.boundingBox()
    expect(box?.height ?? 99).toBeLessThan(20)
    expect(box?.width ?? 99).toBeLessThan(20)
  })

  test('move stays disabled when date unchanged', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    await page.getByRole('button', { name: dayCellName(today) }).click()

    await expect(page.getByRole('button', { name: 'Move' })).toBeDisabled()
  })

  test('move is hidden while workout session is active', async ({ page }) => {
    await seedActiveWorkoutSession(page, today)
    await page.getByRole('button', { name: dayCellName(today) }).click()

    await expect(page.getByRole('button', { name: 'Move' })).toHaveCount(0)
    await expect(page.getByRole('dialog')).toContainText(/finish or leave|заверши или выйди/i)
  })

  test('move reschedules when date changes', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    await page.getByRole('button', { name: dayCellName(today) }).click()

    await moveOption(page, moveOptionName(addDays(today, 1))).click()
    await page.getByRole('button', { name: 'Move' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  // Every move cascaded the following slot, which re-opened the +-3 window and
  // let a workout be pushed back three days at a time without limit. The clock
  // is pinned to a Monday so the seeded slot sits exactly where the generator
  // would put it and the allowance is a clean three days.
  test('repeated moves cannot push a workout past its window', async ({ page }) => {
    const monday = '2026-11-02'
    await freezeToday(page, monday)
    await prepareProgress(page, {
      anchor: 7,
      today: monday,
      weekdays: ['mon', 'wed', 'fri'],
      schedule: [
        { date: monday, stepRef: 1 },
        { date: addDays(monday, 2), stepRef: 1 },
        { date: addDays(monday, 4), stepRef: 1 },
      ],
    })
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()

    const headDate = async () =>
      ((await readProgress(page))?.schedule as { date: string }[])[0].date
    let applied = 0
    let exhausted = false

    for (let i = 0; i < 10; i++) {
      const current = await headDate()
      await page.getByRole('button', { name: dayCellName(current, 'planned') }).click()
      const labels = await page.locator('.optrow .opt').allInnerTexts()
      const target = [3, 2, 1]
        .map((d) => moveOptionName(addDays(current, d)))
        .find((name) => labels.includes(name))
      if (!target) {
        await expect(page.getByRole('dialog')).toContainText(/already as late/i)
        await page.getByRole('button', { name: 'Close' }).click()
        exhausted = true
        break
      }
      await moveOption(page, target).click()
      await page.getByRole('button', { name: 'Move' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      applied++
    }

    expect(applied).toBeGreaterThan(0)
    expect(exhausted).toBe(true)
    expect(await headDate()).toBe(addDays(monday, 3))
  })

  test('move options exclude dates within 48h of previous workout', async ({ page }) => {
    const prevDate = addDays(today, -5)
    const slotDate = addDays(today, 2)
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: prevDate, stepRef: 1 },
        { date: slotDate, stepRef: 2 },
      ],
      state: { stepInCycle: 2 },
      lastWorkoutDate: prevDate,
      workoutRecords: [{ date: prevDate, result: 'success' }],
    })
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()

    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string }[]
    const targetDate = schedule[1]?.date ?? slotDate
    await page.getByRole('button', { name: dayCellName(targetDate) }).click()

    const tooSoon = addDays(prevDate, 1)
    await expect(moveOption(page, moveOptionName(tooSoon))).toHaveCount(0)
  })

  test('failed workout shows attempted styling not missed', async ({ page }) => {
    const failDate = addDays(today, -2)
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: failDate, stepRef: 1 },
        { date: addDays(today, 2), stepRef: 2 },
      ],
    })
    await seedWorkoutRecord(page, { date: failDate, result: 'fail' })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await showCalendarMonth(page, failDate)

    await expect(page.locator('.day.failed').first()).toBeVisible()
    await expect(page.locator('.day.missed').first()).toHaveCount(0)
  })

  test('failed workout day opens read-only sheet', async ({ page }) => {
    const failDate = addDays(today, -2)
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: addDays(today, 2), stepRef: 1 },
      ],
    })
    await seedWorkoutRecord(page, { date: failDate, result: 'fail' })
    await page.reload({ waitUntil: 'networkidle' })
    await dismissPwaModal(page)
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await showCalendarMonth(page, failDate)

    await page.getByRole('button', { name: dayCellName(failDate, 'attempted|попытка') }).click()

    await expect(page.getByRole('button', { name: /move|перенести/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /start now|начать/i })).toHaveCount(0)
    await expect(page.getByText(/already logged|уже записана/i)).toBeVisible()
    await expect(page.getByText(/day history|история дня/i)).toBeVisible()
  })

  test('2x frequency builds schedule with at least 72h gaps', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('button', { name: /2×\s*\/\s*week|2×\s*\/\s*нед/i }).click()

    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string }[]
    expect(schedule.length).toBeGreaterThan(1)
    const gapDays = (a: string, b: string) => {
      const da = new Date(a)
      const db = new Date(b)
      return (db.getTime() - da.getTime()) / 86400000
    }
    expect(gapDays(schedule[0].date, schedule[1].date)).toBeGreaterThanOrEqual(3)
  })

  // D6: month navigation and today button
  test('month navigation changes displayed month', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)
    const monthHeading = page.locator('.calendar-wrap .head h1')
    const before = await monthHeading.textContent()
    await page.getByRole('button', { name: /next month|следующий месяц/i }).click()
    const after = await monthHeading.textContent()
    expect(after).not.toBe(before)
    await page.getByRole('button', { name: /today|сегодня/i }).click()
  })

  test('month nav controls stay on one row while paging months', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)

    const nav = page.locator('.calendar-wrap .head .nav')
    const positions: { top: number; left: number }[] = []

    for (let i = 0; i < 12; i++) {
      const box = await nav.boundingBox()
      expect(box).not.toBeNull()
      positions.push({ top: box!.y, left: box!.x })
      await page.getByRole('button', { name: /next month|следующий месяц/i }).click()
    }

    const tops = positions.map((p) => p.top)
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2)
  })

  // D2: moving one workout shifts all subsequent schedule dates
  test('move cascades delta to subsequent workouts', async ({ page }) => {
    const slot1 = today
    const slot2 = addDays(today, 2)
    const slot3 = addDays(today, 4)
    await prepareProgress(page, {
      anchor: 7,
      today,
      schedule: [
        { date: slot1, stepRef: 1 },
        { date: slot2, stepRef: 2 },
        { date: slot3, stepRef: 3 },
      ],
      state: { stepInCycle: 1 },
    })
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()

    await page.getByRole('button', { name: dayCellName(slot1) }).click()
    const target = addDays(slot1, 1)
    await moveOption(page, moveOptionName(target)).click()
    await page.getByRole('button', { name: 'Move' }).click()

    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string; stepRef: number }[]
    expect(schedule[0]?.date).toBe(target)
    expect(schedule[1]?.date).toBe(addDays(slot2, 1))
    expect(schedule[2]?.date).toBe(addDays(slot3, 1))
  })
})
