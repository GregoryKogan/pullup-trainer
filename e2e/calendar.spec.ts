import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  prepareSeededApp,
  seedWorkoutRecord,
  readProgress,
  dismissPwaModal,
  todayLocal,
  addDays,
} from './helpers/app'

test.describe('Calendar', () => {
  const today = todayLocal()

  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, today)
  })

  test('opens sheet for scheduled day', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL(/\/calendar/)

    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()

    await expect(page.getByRole('button', { name: 'Start now' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible()
  })

  test('start now navigates to workout', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()
    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()
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
    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, (planned|done)`, 'i') }).click()
    await expect(page.getByText(/day history|история дня/i)).toBeVisible()
    await expect(page.locator('.day-history li').first()).toBeVisible()
  })

  test('shows hint for unscheduled day', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    await page.locator('.calgrid button.day.rest:not(.out)').first().click()

    await expect(page.getByRole('status')).toContainText(/no workout planned|не запланирована/i)
  })

  test('legend today dot stays small', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    const dot = page.locator('.legend .dot.today')
    await expect(dot).toBeVisible()
    const box = await dot.boundingBox()
    expect(box?.height ?? 99).toBeLessThan(16)
    expect(box?.width ?? 99).toBeLessThan(16)
  })

  test('move stays disabled when date unchanged', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()

    await expect(page.getByRole('button', { name: 'Move' })).toBeDisabled()
  })

  test('move reschedules when date changes', async ({ page }) => {
    await page.getByRole('link', { name: 'Calendar' }).click()

    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()

    const altOption = page.locator('.opt').filter({ hasNotText: new RegExp(`${dayNum}`, 'i') }).first()
    await altOption.click()
    await page.getByRole('button', { name: 'Move' }).click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
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
      workoutRecords: [{ date: prevDate, result: 'success' }],
    })
    await page.evaluate(() => sessionStorage.setItem('pullup-trainer-autoshift-shown', '1'))
    await page.getByRole('navigation').getByRole('link', { name: 'Calendar' }).click()

    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string }[]
    const targetDate = schedule[1]?.date ?? slotDate
    const slotDay = String(Number(targetDate.split('-')[2]))
    await page.getByRole('button', { name: new RegExp(`${slotDay}, planned`, 'i') }).click()

    const tooSoon = addDays(prevDate, 1)
    const tooSoonDay = String(Number(tooSoon.split('-')[2]))
    await expect(page.locator('.opt').filter({ hasText: new RegExp(tooSoonDay) })).toHaveCount(0)
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

    await expect(page.locator('.day.failed').first()).toBeVisible()
    await expect(page.locator('.day.missed').first()).toHaveCount(0)
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

    const dayNum = String(new Date().getDate())
    await page.getByRole('button', { name: new RegExp(`${dayNum}, planned`, 'i') }).click()
    const target = addDays(slot1, 1)
    const targetDay = String(Number(target.split('-')[2]))
    await page.locator('.opt').filter({ hasText: new RegExp(targetDay) }).first().click()
    await page.getByRole('button', { name: 'Move' }).click()

    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string; stepRef: number }[]
    expect(schedule[0]?.date).toBe(target)
    expect(schedule[1]?.date).toBe(addDays(slot2, 1))
    expect(schedule[2]?.date).toBe(addDays(slot3, 1))
  })
})
