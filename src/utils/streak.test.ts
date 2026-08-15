import { describe, it, expect } from 'vitest'
import { computeWeeklyStreak } from './streak'
import type { WorkoutRecord } from '@/domain/types'

function workout(date: string): WorkoutRecord {
  return {
    date,
    startedAt: `${date}T10:00:00+03:00`,
    durationSeconds: 600,
    kind: 'workout',
    program: 'builtin',
    programName: 'Pull-up Trainer',
    result: 'success',
    sets: [],
    totals: { volumeReps: 10, maxSetReps: 5, holdSeconds: 0 },
  }
}

describe('computeWeeklyStreak', () => {
  it('counts consecutive weeks meeting frequency minus one skip', () => {
    const records = [
      workout('2026-08-13'),
      workout('2026-08-11'),
      workout('2026-08-06'),
      workout('2026-08-04'),
    ]
    expect(computeWeeklyStreak(records, 3, '2026-08-15')).toBeGreaterThanOrEqual(2)
  })

  it('returns zero with no records', () => {
    expect(computeWeeklyStreak([], 3, '2026-08-15')).toBe(0)
  })
})
