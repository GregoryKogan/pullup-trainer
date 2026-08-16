import { test, expect } from '@playwright/test'
import {
  prepareProgress,
  completeWorkout,
  failWorkoutEarly,
  failWorkoutFinalShort,
  readProgress,
  todayLocal,
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

  test('fail keeps the same stepRef', async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today, stepRef: 2 })
    await failWorkoutEarly(page)
    const progress = await readProgress(page)
    const schedule = progress?.schedule as { stepRef: number }[]
    expect(schedule[0]?.stepRef).toBe(2)
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

  test('two fails trigger deload anchor 7 to 6', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 3,
      state: { stepInCycle: 3 },
    })
    await failWorkoutEarly(page)
    await page.getByRole('button', { name: /try again|ещё раз|повтор/i }).click()
    await page.getByRole('button', { name: /leave workout|выйти из тренировки/i }).click()
    await page.getByRole('button', { name: /^confirm$|^подтвердить$/i }).click()
    await expect(page).toHaveURL(/\/result/)
    const progress = await readProgress(page)
    const state = progress?.state as { anchor: number; failStreak: number }
    expect(state.anchor).toBe(6)
    expect(state.failStreak).toBe(0)
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
