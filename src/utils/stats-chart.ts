import type { WorkoutRecord } from '@/domain/types'
import { startOfWeek } from '@/utils/dates'

export const CHART_TICK_X = 34
export const CHART_X_START = 58
export const CHART_X_END = 330
export const CHART_Y_BASE = 130
export const CHART_Y_RANGE = 100

export const MAX_REPS_SERIES_LIMIT = 6
export const WEEKLY_BARS_SERIES_LIMIT = 7
export const NARROW_DISPLAY_LIMIT = 4

export interface ChartPoint {
  date: string
  value: number
}

export interface WeeklyBar {
  week: string
  vol: number
}

export function chartX(
  index: number,
  count: number,
  start = CHART_X_START,
  end = CHART_X_END,
): number {
  if (count <= 1) return (start + end) / 2
  return start + (index * (end - start)) / (count - 1)
}

export function chartY(value: number, max: number): number {
  if (max <= 0) return CHART_Y_BASE
  return CHART_Y_BASE - (value / max) * CHART_Y_RANGE
}

export function buildMaxRepsPoints(records: WorkoutRecord[]): ChartPoint[] {
  const points: ChartPoint[] = []
  for (const r of [...records].reverse()) {
    let v = r.totals.maxSetReps
    if (r.kind === 'test') v = r.sets[0]?.done ?? 0
    if (v > 0) points.push({ date: r.date, value: v })
  }
  return points.slice(-MAX_REPS_SERIES_LIMIT)
}

export function buildWeeklyBars(records: WorkoutRecord[]): WeeklyBar[] {
  const map = new Map<string, number>()
  for (const r of records) {
    if (r.kind !== 'workout') continue
    const w = startOfWeek(r.date)
    map.set(w, (map.get(w) ?? 0) + r.totals.volumeReps)
  }
  return [...map.entries()]
    .slice(-WEEKLY_BARS_SERIES_LIMIT)
    .map(([week, vol]) => ({ week, vol }))
}

export function sliceForDisplay<T>(
  items: T[],
  isNarrow: boolean,
  narrowLimit = NARROW_DISPLAY_LIMIT,
): T[] {
  return isNarrow && items.length > narrowLimit ? items.slice(-narrowLimit) : items
}

export function shouldShowChartDateLabel(
  index: number,
  total: number,
  _isNarrow: boolean,
): boolean {
  if (total <= 1) return true
  if (total <= NARROW_DISPLAY_LIMIT) return true
  if (index === 0 || index === total - 1) return true
  return index % 2 === 0
}

const VALUE_LABEL_MIN_X_GAP = 48
const VALUE_LABEL_MIN_Y_GAP = 14

export function shouldShowChartValueLabel(
  index: number,
  values: number[],
  max: number,
  _isNarrow: boolean,
): boolean {
  if (values.length <= 1) return true
  if (index === 0 || index === values.length - 1) return true

  const count = values.length
  const x = chartX(index, count)
  const y = chartY(values[index], max) - 8

  for (let j = 0; j < values.length; j++) {
    if (j === index) continue
    const nx = chartX(j, count)
    const ny = chartY(values[j], max) - 8
    const dx = Math.abs(x - nx)
    const dy = Math.abs(y - ny)
    if (dx < VALUE_LABEL_MIN_X_GAP && dy < VALUE_LABEL_MIN_Y_GAP) {
      return false
    }
  }

  return true
}

export function shouldShowWeeklyValueLabel(
  index: number,
  values: number[],
  max: number,
  _isNarrow: boolean,
): boolean {
  if (values[index] <= 0) return false
  if (values.length <= 1) return true
  if (index === 0 || index === values.length - 1) return true

  const count = values.length
  const x = chartX(index, count)
  const y = chartY(values[index], max) - 6

  for (let j = 0; j < values.length; j++) {
    if (j === index) continue
    const nx = chartX(j, count)
    const ny = chartY(values[j], max) - 6
    const dx = Math.abs(x - nx)
    const dy = Math.abs(y - ny)
    if (dx < VALUE_LABEL_MIN_X_GAP && dy < VALUE_LABEL_MIN_Y_GAP) {
      return false
    }
  }

  return true
}
