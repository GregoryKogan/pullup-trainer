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
})
