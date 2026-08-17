import { describe, it, expect } from 'vitest'
import { settlePastMissedWorkouts } from './settlement'
import type { ActiveProgress } from './types'

const PROGRAM = 'Pull-up Trainer'

function baseProgress(overrides: Partial<ActiveProgress> = {}): ActiveProgress {
  return {
    frequencyDays: 3,
    weekdays: ['mon', 'wed', 'fri'],
    schedule: [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-06', stepRef: 1 },
    ],
    lastWorkoutDate: null,
    state: {
      anchor: 7,
      level: 'L2',
      cycleIndex: 0,
      stepInCycle: 1,
      failStreak: 0,
      lastRetestDate: '2026-08-01',
      lastRetestCycleIndex: 0,
      cycleBestMax: 0,
    },
    ...overrides,
  }
}

describe('settlePastMissedWorkouts', () => {
  it('records fail for a single past missed slot', () => {
    const progress = baseProgress()
    const result = settlePastMissedWorkouts(progress, [], '2026-08-05', PROGRAM)

    expect(result.newRecords).toHaveLength(1)
    expect(result.newRecords[0].date).toBe('2026-08-03')
    expect(result.newRecords[0].result).toBe('fail')
    expect(result.newRecords[0].sets.every((s) => s.done === 0)).toBe(true)
    expect(result.progress.lastWorkoutDate).toBe('2026-08-03')
    expect(result.progress.state.failStreak).toBe(1)
    expect(result.progress.schedule[0].date).toBe('2026-08-06')
  })

  it('does not settle today or future slots', () => {
    const progress = baseProgress({
      schedule: [
        { date: '2026-08-05', stepRef: 1 },
        { date: '2026-08-08', stepRef: 1 },
      ],
    })
    const result = settlePastMissedWorkouts(progress, [], '2026-08-05', PROGRAM)
    expect(result.newRecords).toHaveLength(0)
    expect(result.progress).toEqual(progress)
  })

  it('settles multiple past missed slots chronologically', () => {
    const progress = baseProgress({
      schedule: [
        { date: '2026-08-03', stepRef: 1 },
        { date: '2026-08-06', stepRef: 1 },
        { date: '2026-08-09', stepRef: 1 },
      ],
    })
    const result = settlePastMissedWorkouts(progress, [], '2026-08-10', PROGRAM)

    expect(result.newRecords).toHaveLength(3)
    expect(result.newRecords[0].date).toBe('2026-08-03')
    expect(result.newRecords[1].date).toBe('2026-08-06')
    expect(result.newRecords[2].date).toBe('2026-08-09')
    expect(result.progress.state.anchor).toBe(6)
    expect(result.progress.state.failStreak).toBe(1)
    expect(result.progress.lastWorkoutDate).toBe('2026-08-09')
  })

  it('skips slots that already have workout records', () => {
    const progress = baseProgress({
      schedule: [
        { date: '2026-08-03', stepRef: 1 },
        { date: '2026-08-06', stepRef: 2 },
      ],
      lastWorkoutDate: '2026-08-03',
    })
    const records = [
      {
        date: '2026-08-03',
        startedAt: '2026-08-03T10:00:00',
        durationSeconds: 0,
        kind: 'workout' as const,
        program: 'builtin' as const,
        programName: PROGRAM,
        result: 'success' as const,
        sets: [],
        totals: { volumeReps: 0, maxSetReps: 0 },
      },
    ]
    const result = settlePastMissedWorkouts(progress, records, '2026-08-08', PROGRAM)

    expect(result.newRecords).toHaveLength(1)
    expect(result.newRecords[0].date).toBe('2026-08-06')
  })
})
