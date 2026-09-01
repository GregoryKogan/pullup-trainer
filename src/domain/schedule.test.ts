import { describe, it, expect } from 'vitest'
import {
  buildInitialSchedule,
  rescheduleWorkout,
  detectReturnPolicy,
  firstTrainingDateAfterTest,
  findScheduleSlotIndex,
  getRescheduleOptions,
  advanceScheduleAfterWorkout,
  hasWorkoutRecord,
  canStartEarly,
  intendedSlotDate,
  latestAllowedMoveDate,
  MAX_MOVE_DAYS,
  MIN_REST_DAYS,
  type ScheduleContext,
} from './schedule'
import type { ScheduleSlot, WorkoutRecord } from './types'
import { addDays, daysBetween, formatLocalDate, parseLocalDate } from '@/utils/dates'

const WEEKDAYS = ['mon', 'wed', 'fri'] as const

function ctx(today: string, lastWorkoutDate: string | null = null): ScheduleContext {
  return { today, lastWorkoutDate, frequencyDays: 3, weekdays: [...WEEKDAYS] }
}

describe('schedule', () => {
  it('builds schedule with min 48h gap', () => {
    const slots = buildInitialSchedule('2026-08-03', [1, 1, 1], 3, [...WEEKDAYS])
    expect(slots.length).toBe(3)
    const gap = (a: string, b: string) => {
      const da = parseLocalDate(a)
      const db = parseLocalDate(b)
      return (db.getTime() - da.getTime()) / 86400000
    }
    expect(gap(slots[0].date, slots[1].date)).toBeGreaterThanOrEqual(MIN_REST_DAYS)
    expect(gap(slots[1].date, slots[2].date)).toBeGreaterThanOrEqual(MIN_REST_DAYS)
  })

  it('handles leap year Feb 29', () => {
    const slots = buildInitialSchedule('2024-02-28', [1, 1], 3, [...WEEKDAYS])
    expect(slots[0].date).toMatch(/2024-02-/)
    expect(slots[1].date).toMatch(/2024-03-/)
  })

  it('findScheduleSlotIndex matches date or falls back to 0', () => {
    const schedule = [
      { date: '2026-08-17', stepRef: 1 },
      { date: '2026-08-20', stepRef: 2 },
    ]
    expect(findScheduleSlotIndex(schedule, '2026-08-20')).toBe(1)
    expect(findScheduleSlotIndex(schedule, '2026-08-99')).toBe(0)
  })

  it('reschedule cascades following slots', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-05', stepRef: 1 },
      { date: '2026-08-07', stepRef: 1 },
    ]
    const moved = rescheduleWorkout(schedule, 1, '2026-08-06', ctx('2026-08-01'))
    expect(moved).not.toBeNull()
    expect(moved![1].date).toBe('2026-08-06')
    expect(moved![2].date).toBe('2026-08-08')
  })

  it('rejects reschedule within 48h of previous slot', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-05', stepRef: 1 },
    ]
    expect(rescheduleWorkout(schedule, 1, '2026-08-04', ctx('2026-08-01'))).toBeNull()
  })

  it('rejects reschedule within 48h of lastWorkoutDate for slot 0', () => {
    const schedule = [{ date: '2026-08-06', stepRef: 2 }]
    expect(
      rescheduleWorkout(schedule, 0, '2026-08-05', ctx('2026-08-05', '2026-08-04')),
    ).toBeNull()
  })

  it('allows early start to today when lastWorkoutDate gap is sufficient', () => {
    const schedule = [{ date: '2026-08-08', stepRef: 2 }]
    expect(canStartEarly(schedule, 0, ctx('2026-08-06', '2026-08-03'))).toBe(true)
    expect(
      rescheduleWorkout(schedule, 0, '2026-08-06', ctx('2026-08-06', '2026-08-03')),
    ).not.toBeNull()
  })

  it('rejects reschedule to a past date', () => {
    const schedule = [
      { date: '2026-08-10', stepRef: 1 },
      { date: '2026-08-12', stepRef: 1 },
      { date: '2026-08-14', stepRef: 1 },
    ]
    expect(rescheduleWorkout(schedule, 1, '2026-08-11', ctx('2026-08-12'))).toBeNull()
  })

  it('getRescheduleOptions excludes past dates and dates within 48h of lastWorkout', () => {
    const schedule = [
      { date: '2026-08-10', stepRef: 1 },
      { date: '2026-08-12', stepRef: 1 },
      { date: '2026-08-14', stepRef: 1 },
    ]
    const options = getRescheduleOptions(schedule, 1, ctx('2026-08-12', '2026-08-10'))
    expect(options).not.toContain('2026-08-10')
    expect(options).not.toContain('2026-08-11')
    expect(options).toContain('2026-08-12')
    expect(options).toContain('2026-08-13')

    const slot0Options = getRescheduleOptions(
      [{ date: '2026-08-08', stepRef: 1 }],
      0,
      ctx('2026-08-06', '2026-08-05'),
    )
    expect(slot0Options).not.toContain('2026-08-06')
  })

  it('caps how far a slot can be postponed no matter how often it is moved', () => {
    const context = ctx('2026-08-03')
    let schedule: ScheduleSlot[] = buildInitialSchedule(
      '2026-08-03',
      [1, 1, 1, 1],
      3,
      [...WEEKDAYS],
    )
    const original = schedule[0].date
    let moves = 0

    for (let i = 0; i < 20; i++) {
      const later = getRescheduleOptions(schedule, 0, context).filter((o) => o > schedule[0].date)
      if (later.length === 0) break
      const moved = rescheduleWorkout(schedule, 0, later[later.length - 1], context)
      expect(moved).not.toBeNull()
      schedule = moved!
      moves++
    }

    expect(moves).toBeGreaterThan(0)
    expect(daysBetween(original, schedule[0].date)).toBe(MAX_MOVE_DAYS)
    expect(getRescheduleOptions(schedule, 0, context).some((o) => o > schedule[0].date)).toBe(false)
  })

  it('caps a slot against where the generator would place it', () => {
    const context = ctx('2026-08-01')
    const schedule = buildInitialSchedule('2026-08-03', [1, 1, 1], 3, [...WEEKDAYS])
    const last = schedule.length - 1
    const intended = intendedSlotDate(schedule, last, context)
    expect(intended).toBe(schedule[last].date)
    expect(latestAllowedMoveDate(schedule, last, context)).toBe(addDays(intended, MAX_MOVE_DAYS))
    expect(
      rescheduleWorkout(schedule, last, addDays(intended, MAX_MOVE_DAYS), context),
    ).not.toBeNull()
    expect(
      rescheduleWorkout(schedule, last, addDays(intended, MAX_MOVE_DAYS + 1), context),
    ).toBeNull()
  })

  it('still allows pulling a workout earlier after a long break', () => {
    const schedule = [{ date: '2026-08-20', stepRef: 1 }]
    expect(canStartEarly(schedule, 0, ctx('2026-08-18', '2026-08-01'))).toBe(true)
  })

  it('detectReturnPolicy', () => {
    expect(detectReturnPolicy('2026-08-01', '2026-08-10')).toBe('continue')
    expect(detectReturnPolicy('2026-07-01', '2026-08-01')).toBe('retest')
    // A recalibration after the break answers the prompt.
    expect(detectReturnPolicy('2026-07-01', '2026-08-01', '2026-08-01')).toBe('continue')
    expect(detectReturnPolicy('2026-07-01', '2026-08-01', '2026-06-01')).toBe('retest')
  })

  it('local date format roundtrip', () => {
    const d = new Date(2026, 7, 15, 23, 30)
    const iso = formatLocalDate(d)
    expect(iso).toBe('2026-08-15')
    expect(addDays(iso, 1)).toBe('2026-08-16')
  })

  it('hasWorkoutRecord ignores tests', () => {
    const records = [
      { kind: 'test', date: '2026-08-03' },
      { kind: 'workout', date: '2026-08-06' },
    ] as WorkoutRecord[]
    expect(hasWorkoutRecord(records, '2026-08-03')).toBe(false)
    expect(hasWorkoutRecord(records, '2026-08-06')).toBe(true)
  })

  it('advanceScheduleAfterWorkout on success shifts slot 0 and updates stepRef', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-06', stepRef: 1 },
      { date: '2026-08-09', stepRef: 1 },
    ]
    const next = advanceScheduleAfterWorkout(schedule, 0, true, 2, 3, [...WEEKDAYS])
    expect(next).toHaveLength(2)
    expect(next[0].date).toBe('2026-08-06')
    expect(next[0].stepRef).toBe(2)
  })

  it('advanceScheduleAfterWorkout on fail shifts slot 0 and keeps stepRef', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 2 },
      { date: '2026-08-06', stepRef: 2 },
      { date: '2026-08-09', stepRef: 2 },
    ]
    const next = advanceScheduleAfterWorkout(schedule, 0, false, 2, 3, [...WEEKDAYS])
    expect(next).toHaveLength(2)
    expect(next[0].date).toBe('2026-08-06')
    expect(next[0].stepRef).toBe(2)
  })

  it('advanceScheduleAfterWorkout on fail removes early-start slot', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 2 },
      { date: '2026-08-06', stepRef: 2 },
      { date: '2026-08-09', stepRef: 2 },
    ]
    const next = advanceScheduleAfterWorkout(schedule, 1, false, 2, 3, [...WEEKDAYS])
    expect(next).toHaveLength(2)
    expect(next.map((s) => s.date)).toEqual(['2026-08-03', '2026-08-09'])
  })
})

describe('firstTrainingDateAfterTest', () => {
  it('leaves the minimum rest gap after a max test', () => {
    expect(firstTrainingDateAfterTest('2026-08-18', 3)).toBe('2026-08-20')
    expect(firstTrainingDateAfterTest('2026-08-18', 2)).toBe('2026-08-21')
  })
})
