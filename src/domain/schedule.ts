import type { ScheduleSlot, Weekday, ReturnPolicy, WorkoutRecord } from './types'
import { addDays, daysBetween, parseLocalDate, formatLocalDate } from '@/utils/dates'

export const MIN_REST_DAYS = 2
export const MAX_MOVE_DAYS = 3

export interface ScheduleContext {
  today: string
  lastWorkoutDate: string | null
  frequencyDays: 2 | 3
  weekdays: Weekday[]
}

export function minGapDays(frequencyDays: 2 | 3): number {
  return frequencyDays === 3 ? 2 : 3
}

const WEEKDAY_INDEX: Record<Weekday, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
}

export function nextWeekdayOnOrAfter(fromIso: string, weekdays: Weekday[]): string {
  const allowed = new Set(weekdays.map((w) => WEEKDAY_INDEX[w]))
  const d = parseLocalDate(fromIso)
  for (let i = 0; i < 14; i++) {
    if (allowed.has(d.getDay())) return formatLocalDate(d)
    d.setDate(d.getDate() + 1)
  }
  return formatLocalDate(d)
}

export function firstTrainingDateAfterTest(
  testDate: string,
  frequencyDays: 2 | 3,
): string {
  return addDays(testDate, minGapDays(frequencyDays))
}

export function buildInitialSchedule(
  startDate: string,
  stepRefs: number[],
  frequencyDays: 2 | 3,
  weekdays: Weekday[],
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = []
  let cursor = startDate
  for (let i = 0; i < stepRefs.length; i++) {
    if (i === 0) {
      cursor = nextWeekdayOnOrAfter(startDate, weekdays)
    } else {
      cursor = addDays(cursor, minGapDays(frequencyDays))
      cursor = nextWeekdayOnOrAfter(cursor, weekdays)
    }
    slots.push({ date: cursor, stepRef: stepRefs[i] })
  }
  return slots
}

export function buildBuiltinScheduleSlots(
  startDate: string,
  stepRef: number,
  count: number,
  frequencyDays: 2 | 3,
  weekdays: Weekday[],
): ScheduleSlot[] {
  return buildInitialSchedule(
    startDate,
    Array.from({ length: count }, () => stepRef),
    frequencyDays,
    weekdays,
  )
}

export function extendSchedule(
  schedule: ScheduleSlot[],
  newStepRefs: number[],
  frequencyDays: 2 | 3,
  weekdays: Weekday[],
): ScheduleSlot[] {
  if (schedule.length === 0) {
    return buildInitialSchedule(formatLocalDate(new Date()), newStepRefs, frequencyDays, weekdays)
  }
  const last = schedule[schedule.length - 1]
  const result = [...schedule]
  let cursor = last.date
  for (const stepRef of newStepRefs) {
    cursor = addDays(cursor, minGapDays(frequencyDays))
    cursor = nextWeekdayOnOrAfter(cursor, weekdays)
    result.push({ date: cursor, stepRef })
  }
  return result
}

export function intendedSlotDate(
  schedule: ScheduleSlot[],
  slotIndex: number,
  ctx: ScheduleContext,
): string {
  const prevDate = slotIndex > 0 ? schedule[slotIndex - 1].date : null
  const from = prevDate ? addDays(prevDate, minGapDays(ctx.frequencyDays)) : ctx.today
  return nextWeekdayOnOrAfter(from, ctx.weekdays)
}

export function latestAllowedMoveDate(
  schedule: ScheduleSlot[],
  slotIndex: number,
  ctx: ScheduleContext,
): string {
  return addDays(intendedSlotDate(schedule, slotIndex, ctx), MAX_MOVE_DAYS)
}

function exceedsMoveWindow(
  schedule: ScheduleSlot[],
  slotIndex: number,
  candidate: string,
  ctx: ScheduleContext,
): boolean {
  if (daysBetween(schedule[slotIndex].date, candidate) <= 0) return false
  return daysBetween(latestAllowedMoveDate(schedule, slotIndex, ctx), candidate) > 0
}

export function rescheduleWorkout(
  schedule: ScheduleSlot[],
  slotIndex: number,
  newDate: string,
  ctx: ScheduleContext,
): ScheduleSlot[] | null {
  if (slotIndex < 0 || slotIndex >= schedule.length) return null
  if (daysBetween(ctx.today, newDate) < 0) return null
  if (ctx.lastWorkoutDate && daysBetween(ctx.lastWorkoutDate, newDate) < MIN_REST_DAYS) return null
  const prevDate = slotIndex > 0 ? schedule[slotIndex - 1].date : null
  const nextDate = slotIndex < schedule.length - 1 ? schedule[slotIndex + 1].date : null

  if (prevDate && daysBetween(prevDate, newDate) < MIN_REST_DAYS) return null
  if (nextDate && daysBetween(newDate, nextDate) < 0) return null
  if (exceedsMoveWindow(schedule, slotIndex, newDate, ctx)) return null

  const oldDate = schedule[slotIndex].date
  const delta = daysBetween(oldDate, newDate)
  if (delta === 0) return [...schedule]

  const result = schedule.map((s, i) => {
    if (i < slotIndex) return { ...s }
    if (i === slotIndex) return { ...s, date: newDate }
    return { ...s, date: addDays(s.date, delta) }
  })

  for (let i = 1; i < result.length; i++) {
    const gap = daysBetween(result[i - 1].date, result[i].date)
    if (gap < MIN_REST_DAYS) return null
  }
  return result
}

export function canStartEarly(
  schedule: ScheduleSlot[],
  slotIndex: number,
  ctx: ScheduleContext,
): boolean {
  return rescheduleWorkout(schedule, slotIndex, ctx.today, ctx) !== null
}

export function findScheduleSlotIndex(schedule: ScheduleSlot[], date: string): number {
  const idx = schedule.findIndex((s) => s.date === date)
  return idx >= 0 ? idx : 0
}

export function detectReturnPolicy(
  lastWorkoutDate: string | null,
  today: string,
  lastRetestDate?: string | null,
): ReturnPolicy {
  if (!lastWorkoutDate) return 'continue'
  if (lastRetestDate && lastRetestDate > lastWorkoutDate) return 'continue'
  return daysBetween(lastWorkoutDate, today) > 14 ? 'retest' : 'continue'
}

export function getRescheduleOptions(
  schedule: ScheduleSlot[],
  slotIndex: number,
  ctx: ScheduleContext,
): string[] {
  if (slotIndex < 0 || slotIndex >= schedule.length) return []
  const prevDate = slotIndex > 0 ? schedule[slotIndex - 1].date : null
  const nextDate = slotIndex < schedule.length - 1 ? schedule[slotIndex + 1].date : null
  const current = schedule[slotIndex].date
  const options: string[] = []
  for (let d = -MAX_MOVE_DAYS; d <= MAX_MOVE_DAYS; d++) {
    const candidate = addDays(current, d)
    if (daysBetween(ctx.today, candidate) < 0) continue
    if (ctx.lastWorkoutDate && daysBetween(ctx.lastWorkoutDate, candidate) < MIN_REST_DAYS) continue
    if (prevDate && daysBetween(prevDate, candidate) < MIN_REST_DAYS) continue
    if (nextDate && daysBetween(candidate, nextDate) < 0) continue
    if (exceedsMoveWindow(schedule, slotIndex, candidate, ctx)) continue
    options.push(candidate)
  }
  return options
}

export function hasWorkoutRecord(records: WorkoutRecord[], date: string): boolean {
  return records.some((r) => r.kind === 'workout' && r.date === date)
}

function appendNextScheduleSlot(
  result: ScheduleSlot[],
  lastDate: string,
  stepRef: number,
  frequencyDays: 2 | 3,
  weekdays: Weekday[],
): ScheduleSlot[] {
  let cursor = addDays(lastDate, minGapDays(frequencyDays))
  cursor = nextWeekdayOnOrAfter(cursor, weekdays)
  result.push({ date: cursor, stepRef })
  return result
}

export function advanceScheduleAfterWorkout(
  schedule: ScheduleSlot[],
  slotIndex: number,
  success: boolean,
  nextStepRef: number,
  frequencyDays: 2 | 3,
  weekdays: Weekday[],
): ScheduleSlot[] {
  if (slotIndex < 0 || slotIndex >= schedule.length) return [...schedule]

  const result = [...schedule]

  if (success) {
    if (slotIndex !== 0) return result
    result.shift()
    if (result.length === 0) {
      return appendNextScheduleSlot(
        result,
        schedule[0]?.date ?? formatLocalDate(new Date()),
        nextStepRef,
        frequencyDays,
        weekdays,
      )
    }
    result[0] = { ...result[0], stepRef: nextStepRef }
    return result
  }

  if (slotIndex === 0) {
    const consumedStepRef = result[0].stepRef
    result.shift()
    if (result.length === 0) {
      return appendNextScheduleSlot(
        result,
        schedule[0]?.date ?? formatLocalDate(new Date()),
        consumedStepRef,
        frequencyDays,
        weekdays,
      )
    }
    return result
  }

  result.splice(slotIndex, 1)
  return result
}
