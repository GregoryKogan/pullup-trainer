import { test } from '@playwright/test'
import {
  prepareProgress,
  startWorkout,
  assertSetTargets,
  todayLocal,
} from './helpers/app'

test.describe('Session generator UI', () => {
  const today = todayLocal()

  test('M*=7 k=1 shows targets 5,5,5,4,5', async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today, stepRef: 1 })
    await page.getByRole('button', { name: 'Start' }).click()
    await assertSetTargets(page, [5, 5, 5, 4, 5])
  })

  test('M*=7 k=3 shows max minimum 7', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 3,
      state: { stepInCycle: 3 },
    })
    await startWorkout(page)
    await assertSetTargets(page, [5, 5, 5, 4, 7])
  })

  test('M*=7 k=6 shows max minimum capped at 8', async ({ page }) => {
    await prepareProgress(page, {
      anchor: 7,
      today,
      stepRef: 6,
      state: { stepInCycle: 6 },
    })
    await startWorkout(page)
    await assertSetTargets(page, [5, 5, 5, 4, 8])
  })

  test('M*=3 k=1 shows targets 3,2,2,2,2', async ({ page }) => {
    await prepareProgress(page, { anchor: 3, today, stepRef: 1 })
    await startWorkout(page)
    await assertSetTargets(page, [3, 2, 2, 2, 2])
  })

  test('M*=15 k=1 shows targets 11,9,9,8,9', async ({ page }) => {
    await prepareProgress(page, { anchor: 15, today, stepRef: 1 })
    await startWorkout(page)
    await assertSetTargets(page, [11, 9, 9, 8, 9])
  })

  test('M*=25 k=1 shows targets 18,15,15,13,15', async ({ page }) => {
    await prepareProgress(page, { anchor: 25, today, stepRef: 1 })
    await startWorkout(page)
    await assertSetTargets(page, [18, 15, 15, 13, 15])
  })
})
