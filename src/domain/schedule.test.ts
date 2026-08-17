import { describe, it, expect } from 'vitest'
import {
  buildInitialSchedule,
  rescheduleWorkout,
  autoskipMissed,
  detectReturnPolicy,
  getMissedSlots,
  findScheduleSlotIndex,
  getRescheduleOptions,
  advanceScheduleAfterWorkout,
  hasWorkoutRecord,
} from './schedule'
import type { WorkoutRecord } from './types'
import { addDays, formatLocalDate, parseLocalDate } from '@/utils/dates'

const WEEKDAYS = ['mon', 'wed', 'fri'] as const

describe('schedule', () => {
  it('builds schedule with min 48h gap', () => {
    const slots = buildInitialSchedule('2026-08-03', [1, 1, 1], 3, [...WEEKDAYS])
    expect(slots.length).toBe(3)
    const gap = (a: string, b: string) => {
      const da = parseLocalDate(a)
      const db = parseLocalDate(b)
      return (db.getTime() - da.getTime()) / 86400000
    }
    expect(gap(slots[0].date, slots[1].date)).toBeGreaterThanOrEqual(2)
    expect(gap(slots[1].date, slots[2].date)).toBeGreaterThanOrEqual(2)
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
      { date: '2026-08-06', stepRef: 1 },
      { date: '2026-08-09', stepRef: 1 },
    ]
    const moved = rescheduleWorkout(schedule, 1, '2026-08-07', '2026-08-01')
    expect(moved).not.toBeNull()
    expect(moved![1].date).toBe('2026-08-07')
    expect(moved![2].date).toBe('2026-08-10')
  })

  it('rejects reschedule within 48h of previous', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-06', stepRef: 1 },
    ]
    expect(rescheduleWorkout(schedule, 1, '2026-08-04', '2026-08-01')).toBeNull()
  })

  it('rejects reschedule to a past date', () => {
    const schedule = [
      { date: '2026-08-10', stepRef: 1 },
      { date: '2026-08-16', stepRef: 1 },
      { date: '2026-08-20', stepRef: 1 },
    ]
    expect(rescheduleWorkout(schedule, 1, '2026-08-14', '2026-08-16')).toBeNull()
  })

  it('getRescheduleOptions excludes past dates', () => {
    const schedule = [
      { date: '2026-08-10', stepRef: 1 },
      { date: '2026-08-16', stepRef: 1 },
      { date: '2026-08-20', stepRef: 1 },
    ]
    const options = getRescheduleOptions(schedule, 1, '2026-08-16')
    expect(options).not.toContain('2026-08-14')
    expect(options).not.toContain('2026-08-15')
    expect(options).toContain('2026-08-16')
    expect(options).toContain('2026-08-17')
  })

  it('autoskip preserves intervals on tail', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-06', stepRef: 1 },
      { date: '2026-08-09', stepRef: 1 },
    ]
    const skipped = autoskipMissed(schedule, 0, '2026-08-05')
    expect(skipped[0].date).toBe('2026-08-03')
    expect(skipped[1].date).toBe('2026-08-08')
    expect(skipped[2].date).toBe('2026-08-11')
  })

  it('detectReturnPolicy', () => {
    expect(detectReturnPolicy('2026-08-01', '2026-08-10')).toBe('continue')
    expect(detectReturnPolicy('2026-07-01', '2026-08-01')).toBe('retest')
  })

  it('getMissedSlots', () => {
    const schedule = [
      { date: '2026-08-03', stepRef: 1 },
      { date: '2026-08-06', stepRef: 1 },
    ]
    const missed = getMissedSlots(schedule, new Set(['2026-08-03']), '2026-08-10')
    expect(missed).toHaveLength(1)
    expect(missed[0].date).toBe('2026-08-06')
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
