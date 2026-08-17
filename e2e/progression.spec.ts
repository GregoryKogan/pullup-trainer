import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  completeWorkout,
  failWorkoutEarly,
  failWorkoutFinalShort,
  readProgress,
  todayLocal,
  addDays,
  dismissPwaModal,
} from './helpers/app'

test.describe('Progression', () => {
  const today = todayLocal()

  test('success advances stepRef in schedule', async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today, stepRef: 1 })
    await completeWorkout(page, '8')
    const progress = await readProgress(page)
    const schedule = progress?.schedule as { stepRef: number }[]
    const state = progress?.state as { stepInCycle: number }
    expect(state.stepInCycle).toBe(2)
    expect(schedule[0]?.stepRef).toBe(2)
  })

  test('fail advances schedule date but keeps stepRef', async ({ page }) => {
    const nextDate = addDays(today, 2)
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 2,
      schedule: [
        { date: today, stepRef: 2 },
        { date: nextDate, stepRef: 2 },
      ],
    })
    await failWorkoutEarly(page)
    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string; stepRef: number }[]
    expect(schedule[0]?.date).toBe(nextDate)
    expect(schedule[0]?.stepRef).toBe(2)
  })

  test('logged workout date cannot be restarted', async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today, stepRef: 2 })
    await failWorkoutEarly(page)
    await page.goto(`workout/${today}`)
    await dismissPwaModal(page)
    await expect(page.getByText(/could not load|не удалось загрузить/i)).toBeVisible()
  })

  test('early start reschedules next slot to today', async ({ page }) => {
    const lastDate = addDays(today, -3)
    const futureDate = addDays(today, 2)
    await prepareProgress(page, {
      anchor: 7,
      today,
      lastWorkoutDate: lastDate,
      schedule: [{ date: futureDate, stepRef: 3 }],
      workoutRecords: [{ date: lastDate, result: 'success' }],
      state: { stepInCycle: 3 },
    })
    await page.getByRole('button', { name: /start early|начать раньше/i }).click()
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
    await expect(page).toHaveURL(new RegExp(`/workout/${today.replace(/-/g, '\\-')}`))
    const progress = await readProgress(page)
    const schedule = progress?.schedule as { date: string }[]
    expect(schedule[0]?.date).toBe(today)
  })

  test('early start hidden within 48h of last workout', async ({ page }) => {
    const yesterday = addDays(today, -1)
    await prepareProgress(page, {
      anchor: 7,
      today,
      lastWorkoutDate: yesterday,
      schedule: [{ date: addDays(today, 2), stepRef: 2 }],
      workoutRecords: [{ date: yesterday, result: 'success' }],
      state: { stepInCycle: 2 },
    })
    await expect(page.getByRole('button', { name: /start early|начать раньше/i })).toHaveCount(0)
    await expect(page.getByText(/48 hours|48 часов/i)).toBeVisible()
  })

  test('two fails trigger deload anchor 7 to 6', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 3,
      state: { stepInCycle: 3, failStreak: 1 },
      schedule: [{ date: today, stepRef: 3 }],
      lastWorkoutDate: addDays(today, -3),
      workoutRecords: [{ date: addDays(today, -3), result: 'fail' }],
    })
    await failWorkoutEarly(page)
    const progress = await readProgress(page)
    const state = progress?.state as { anchor: number; failStreak: number }
    expect(state.anchor).toBe(6)
    expect(state.failStreak).toBe(0)
  })

  test('fail only on final set below N_k keeps step', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 3,
      state: { stepInCycle: 3 },
    })
    await failWorkoutFinalShort(page, '6')
    await expect(page).toHaveURL(/\/result/)
    const progress = await readProgress(page)
    const state = progress?.state as { stepInCycle: number; failStreak: number }
    expect(state.stepInCycle).toBe(3)
    expect(state.failStreak).toBe(1)
  })

  test('two fails trigger deload anchor 3 to 2', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 3,
      today,
      stepRef: 2,
      state: { stepInCycle: 2, failStreak: 1 },
    })
    await failWorkoutEarly(page)
    const progress = await readProgress(page)
    const state = progress?.state as { anchor: number }
    expect(state.anchor).toBe(2)
  })

  test('cycle end updates anchor from best final set', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 6,
      state: { stepInCycle: 6, cycleBestMax: 7 },
    })
    await completeWorkout(page, '8')
    const progress = await readProgress(page)
    const state = progress?.state as { anchor: number; stepInCycle: number; cycleIndex: number }
    expect(state.anchor).toBe(8)
    expect(state.stepInCycle).toBe(1)
    expect(state.cycleIndex).toBe(1)
  })
})
