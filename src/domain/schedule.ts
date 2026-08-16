import type { ScheduleSlot, Weekday, ReturnPolicy } from './types'
import { addDays, daysBetween, parseLocalDate, formatLocalDate } from '@/utils/dates'

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
      const minGap = frequencyDays === 3 ? 2 : 3
      cursor = addDays(cursor, minGap)
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
    const minGap = frequencyDays === 3 ? 2 : 3
    cursor = addDays(cursor, minGap)
    cursor = nextWeekdayOnOrAfter(cursor, weekdays)
    result.push({ date: cursor, stepRef })
  }
  return result
}

export function rescheduleWorkout(
  schedule: ScheduleSlot[],
  slotIndex: number,
  newDate: string,
  today: string,
): ScheduleSlot[] | null {
  if (slotIndex < 0 || slotIndex >= schedule.length) return null
  if (daysBetween(today, newDate) < 0) return null
  const prevDate = slotIndex > 0 ? schedule[slotIndex - 1].date : null
  const nextDate = slotIndex < schedule.length - 1 ? schedule[slotIndex + 1].date : null

  if (prevDate && daysBetween(prevDate, newDate) < 2) return null
  if (nextDate && daysBetween(newDate, nextDate) < 0) return null

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
    if (gap < 2) return null
  }
  return result
}

export function autoskipMissed(
  schedule: ScheduleSlot[],
  missedIndex: number,
  today: string,
): ScheduleSlot[] {
  const missed = schedule[missedIndex]
  const delta = Math.max(1, daysBetween(missed.date, today))
  return schedule.map((s, i) => {
    if (i <= missedIndex) return { ...s }
    return { ...s, date: addDays(s.date, delta) }
  })
}

export function getMissedSlots(
  schedule: ScheduleSlot[],
  completedDates: Set<string>,
  today: string,
): ScheduleSlot[] {
  return schedule.filter((s) => s.date < today && !completedDates.has(s.date))
}

export function findScheduleSlotIndex(schedule: ScheduleSlot[], date: string): number {
  const idx = schedule.findIndex((s) => s.date === date)
  return idx >= 0 ? idx : 0
}

export function detectReturnPolicy(lastWorkoutDate: string | null, today: string): ReturnPolicy {
  if (!lastWorkoutDate) return 'continue'
  return daysBetween(lastWorkoutDate, today) > 14 ? 'retest' : 'continue'
}

export function getRescheduleOptions(
  schedule: ScheduleSlot[],
  slotIndex: number,
  today: string,
): string[] {
  if (slotIndex < 0 || slotIndex >= schedule.length) return []
  const prevDate = slotIndex > 0 ? schedule[slotIndex - 1].date : null
  const nextDate = slotIndex < schedule.length - 1 ? schedule[slotIndex + 1].date : null
  const current = schedule[slotIndex].date
  const options: string[] = []
  for (let d = -3; d <= 3; d++) {
    const candidate = addDays(current, d)
    if (daysBetween(today, candidate) < 0) continue
    if (prevDate && daysBetween(prevDate, candidate) < 2) continue
    if (nextDate && daysBetween(candidate, nextDate) < 0) continue
    options.push(candidate)
  }
  return options
}

export function advanceScheduleAfterWorkout(
  schedule: ScheduleSlot[],
  slotIndex: number,
  success: boolean,
  nextStepRef: number,
  frequencyDays: 2 | 3,
  weekdays: Weekday[],
): ScheduleSlot[] {
  const result = [...schedule]
  if (success && slotIndex === 0 && result.length > 0) {
    result.shift()
    if (result.length === 0) {
      const lastDate = schedule[0]?.date ?? formatLocalDate(new Date())
      const minGap = frequencyDays === 3 ? 2 : 3
      let cursor = addDays(lastDate, minGap)
      cursor = nextWeekdayOnOrAfter(cursor, weekdays)
      result.push({ date: cursor, stepRef: nextStepRef })
    } else {
      result[0] = { ...result[0], stepRef: nextStepRef }
    }
  }
  return result
}
