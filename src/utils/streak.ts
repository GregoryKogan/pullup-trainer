import type { WorkoutRecord } from '@/domain/types'
import { startOfWeek, todayLocal } from '@/utils/dates'

export function computeWeeklyStreak(
  records: WorkoutRecord[],
  frequencyDays: 2 | 3,
  today = todayLocal(),
): number {
  const minPerWeek = Math.max(1, frequencyDays - 1)
  const weekCounts = new Map<string, number>()

  for (const r of records) {
    if (r.kind !== 'workout' || r.result !== 'success') continue
    const week = startOfWeek(r.date)
    weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1)
  }

  let streak = 0
  let cursor = startOfWeek(today)

  for (let i = 0; i < 52; i++) {
    const count = weekCounts.get(cursor) ?? 0
    if (count >= minPerWeek) {
      streak++
      const d = new Date(cursor)
      d.setDate(d.getDate() - 7)
      cursor = d.toISOString().slice(0, 10)
    } else if (i === 0 && count > 0) {
      streak = 1
      break
    } else {
      break
    }
  }

  return streak
}
