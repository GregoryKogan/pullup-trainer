import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProgressStore } from '@/stores/progress'
import { db } from '@/db/database'
import { canStartEarly, MIN_REST_DAYS } from '@/domain/schedule'
import { daysBetween } from '@/utils/dates'
import type { WorkoutRecord } from '@/domain/types'

const TODAY = '2026-08-18'

function workoutRecord(date: string, overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    date,
    startedAt: `${date}T10:00:00+03:00`,
    finishedAt: `${date}T10:30:00+03:00`,
    durationSeconds: 1800,
    kind: 'workout',
    program: 'builtin',
    programName: 'Pull-up Trainer',
    context: { level: 'L2', anchor: 7, cycleIndex: 0, stepInCycle: 1 },
    result: 'success',
    sets: [],
    totals: { volumeReps: 24, maxSetReps: 8 },
    ...overrides,
  } as WorkoutRecord
}

describe('useProgressStore', () => {
  beforeEach(async () => {
    // Only Date: faking timers as well would stall Dexie, which needs them.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${TODAY}T12:00:00`))
    setActivePinia(createPinia())
    await db.activeProgress.clear()
    await db.workoutRecords.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initFromTest', () => {
    it('creates progress from a max-rep test and persists it', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)

      expect(store.progress?.state.anchor).toBe(7)
      expect(store.progress?.state.level).toBe('L2')
      expect(store.progress?.state.stepInCycle).toBe(1)
      expect(store.progress?.state.cycleIndex).toBe(0)
      expect(store.progress?.frequencyDays).toBe(3)
      expect(store.progress?.weekdays).toEqual(['mon', 'wed', 'fri'])
      expect(store.progress?.lastWorkoutDate).toBe(TODAY)

      const stored = await db.activeProgress.get('singleton')
      expect(stored?.data?.state.anchor).toBe(7)
    })

    it('builds a schedule that starts no earlier than today', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      const dates = store.progress!.schedule.map((s) => s.date)
      expect(dates.length).toBeGreaterThanOrEqual(8)
      expect(dates.every((d) => d >= TODAY)).toBe(true)
      expect([...dates].sort()).toEqual(dates)
    })

    it('leaves the test day free and rests 48h before the first workout', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      const first = store.progress!.schedule[0].date
      expect(first).not.toBe(TODAY)
      expect(daysBetween(TODAY, first)).toBeGreaterThanOrEqual(MIN_REST_DAYS)
    })

    it('blocks an early start on the test day', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      const p = store.progress!
      expect(
        canStartEarly(p.schedule, 0, {
          today: TODAY,
          lastWorkoutDate: p.lastWorkoutDate,
          frequencyDays: p.frequencyDays,
          weekdays: p.weekdays,
        }),
      ).toBe(false)
    })

    it('rejects a test result below the minimum of 1', async () => {
      const store = useProgressStore()
      await store.initFromTest(0)
      expect(store.progress).toBeNull()
    })

    it.each([
      [3, 'L1'],
      [7, 'L2'],
      [15, 'L3'],
      [25, 'L4'],
    ])('maps anchor %i to level %s', async (anchor, level) => {
      const store = useProgressStore()
      await store.initFromTest(anchor)
      expect(store.progress?.state.level).toBe(level)
    })
  })

  describe('getNextSlot', () => {
    it('returns null without progress', () => {
      expect(useProgressStore().getNextSlot()).toBeNull()
    })

    it('returns the first slot with no workout logged against it', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      const [first, second] = store.progress!.schedule
      expect(store.getNextSlot()?.date).toBe(first.date)

      await store.saveRecord(workoutRecord(first.date))
      expect(store.getNextSlot()?.date).toBe(second.date)
    })

    it('ignores test records when deciding what was attempted', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      const first = store.progress!.schedule[0]
      await store.saveRecord(workoutRecord(first.date, { kind: 'test' }))
      expect(store.getNextSlot()?.date).toBe(first.date)
    })
  })

  describe('saveRecord', () => {
    it('prepends the record with the id assigned by the database', async () => {
      const store = useProgressStore()
      await store.saveRecord(workoutRecord('2026-08-16'))
      await store.saveRecord(workoutRecord('2026-08-18'))

      expect(store.records).toHaveLength(2)
      expect(store.records[0].date).toBe('2026-08-18')
      expect(store.records[0].id).toEqual(expect.any(Number))
      expect(await db.workoutRecords.count()).toBe(2)
    })
  })

  describe('applyRetest', () => {
    it('sets a new anchor, level and retest markers, and rebuilds the schedule', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      await store.updateProgress({
        ...store.progress!,
        state: { ...store.progress!.state, cycleIndex: 2, stepInCycle: 4 },
      })

      await store.applyRetest(15)

      expect(store.progress?.state.anchor).toBe(15)
      expect(store.progress?.state.level).toBe('L3')
      expect(store.progress?.state.lastRetestDate).toBe(TODAY)
      expect(store.progress?.state.lastRetestCycleIndex).toBe(2)
      expect(store.progress?.state.stepInCycle).toBe(4)
      expect(store.progress?.schedule[0].stepRef).toBe(4)
    })

    it('rests 48h after the retest before the next workout', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      await store.applyRetest(9)

      expect(store.progress?.lastWorkoutDate).toBe(TODAY)
      const first = store.progress!.schedule[0].date
      expect(first).not.toBe(TODAY)
      expect(daysBetween(TODAY, first)).toBeGreaterThanOrEqual(MIN_REST_DAYS)
    })

    it('ignores a retest below the minimum of 1', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      await store.applyRetest(0)
      expect(store.progress?.state.anchor).toBe(7)
    })
  })

  describe('reduceAnchor', () => {
    it('drops the anchor by ten percent and restarts the cycle', async () => {
      const store = useProgressStore()
      await store.initFromTest(20)
      await store.updateProgress({
        ...store.progress!,
        state: { ...store.progress!.state, stepInCycle: 5, failStreak: 2 },
      })

      await store.reduceAnchor()

      expect(store.progress?.state.anchor).toBe(18)
      expect(store.progress?.state.level).toBe('L3')
      expect(store.progress?.state.stepInCycle).toBe(1)
      expect(store.progress?.state.failStreak).toBe(0)
      expect(store.progress?.state.lastRetestDate).toBe(TODAY)
    })

    it('never drops the anchor below 1', async () => {
      const store = useProgressStore()
      await store.initFromTest(1)
      await store.reduceAnchor()
      expect(store.progress?.state.anchor).toBe(1)
    })
  })

  describe('updateBuiltinScheduleSettings', () => {
    it('rebuilds the schedule for the new frequency and weekdays', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)

      await store.updateBuiltinScheduleSettings(2, ['tue', 'thu'])

      expect(store.progress?.frequencyDays).toBe(2)
      expect(store.progress?.weekdays).toEqual(['tue', 'thu'])
      const days = store.progress!.schedule.map((s) => new Date(`${s.date}T12:00:00`).getDay())
      expect(days.every((d) => d === 2 || d === 4)).toBe(true)
    })
  })

  describe('hydrate', () => {
    it('loads persisted progress and records, newest record first', async () => {
      const seed = useProgressStore()
      await seed.initFromTest(7)
      await seed.saveRecord(workoutRecord('2026-08-14'))
      await seed.saveRecord(workoutRecord('2026-08-16'))

      setActivePinia(createPinia())
      const store = useProgressStore()
      await store.hydrate()

      expect(store.progress?.state.anchor).toBe(7)
      expect(store.records.map((r) => r.date)).toEqual(['2026-08-16', '2026-08-14'])
    })

    it('leaves progress null when nothing was ever saved', async () => {
      const store = useProgressStore()
      await store.hydrate()
      expect(store.progress).toBeNull()
      expect(store.records).toEqual([])
    })
  })

  describe('settleIfNeeded', () => {
    it('writes a failure for a past slot that was never attempted', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      const past = ['2026-08-10', '2026-08-12']
      await store.updateProgress({
        ...store.progress!,
        schedule: [
          { date: past[0], stepRef: 1 },
          { date: past[1], stepRef: 1 },
          { date: '2026-08-20', stepRef: 1 },
        ],
      })

      await store.settleIfNeeded()

      const settled = store.records.filter((r) => past.includes(r.date))
      expect(settled.length).toBeGreaterThan(0)
      expect(settled.every((r) => r.result === 'fail')).toBe(true)
      expect(await db.workoutRecords.count()).toBe(settled.length)
    })

    it('does nothing when no slot is in the past', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      await store.settleIfNeeded()
      expect(store.records).toEqual([])
    })

    it('does nothing without progress', async () => {
      const store = useProgressStore()
      await store.settleIfNeeded()
      expect(store.progress).toBeNull()
    })
  })

  describe('applyEarlyStartReschedule', () => {
    it('is a no-op when the next slot is already today', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      await store.updateProgress({
        ...store.progress!,
        schedule: [{ date: TODAY, stepRef: 1 }],
      })
      expect(await store.applyEarlyStartReschedule()).toBe(true)
      expect(store.progress?.schedule[0].date).toBe(TODAY)
    })

    it('returns false without progress', async () => {
      expect(await useProgressStore().applyEarlyStartReschedule()).toBe(false)
    })

    it('refuses to pull a workout forward inside the 48 hour rest window', async () => {
      const store = useProgressStore()
      await store.initFromTest(7)
      await store.updateProgress({
        ...store.progress!,
        lastWorkoutDate: TODAY,
        schedule: [{ date: '2026-08-20', stepRef: 1 }],
      })
      expect(await store.applyEarlyStartReschedule()).toBe(false)
      expect(store.progress?.schedule[0].date).toBe('2026-08-20')
    })
  })
})
