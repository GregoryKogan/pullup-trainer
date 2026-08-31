import { describe, it, expect } from 'vitest'
import type { WorkoutRecord } from '@/domain/types'
import {
  CHART_TICK_X,
  CHART_X_END,
  CHART_X_START,
  CHART_Y_BASE,
  buildMaxRepsPoints,
  buildWeeklyBars,
  chartX,
  chartY,
  shouldShowChartDateLabel,
  shouldShowChartValueLabel,
  sliceForDisplay,
} from './stats-chart'
import { addDays } from './dates'

function workout(
  date: string,
  maxSetReps: number,
  volumeReps = maxSetReps * 4,
): WorkoutRecord {
  return {
    date,
    startedAt: `${date}T10:00:00+03:00`,
    durationSeconds: 600,
    kind: 'workout',
    program: 'builtin',
    programName: 'Pull-up Trainer',
    result: 'success',
    sets: [],
    totals: { volumeReps, maxSetReps },
  }
}

describe('stats-chart layout', () => {
  it('chartY maps zero to baseline and max to top', () => {
    expect(chartY(0, 10)).toBe(CHART_Y_BASE)
    expect(chartY(10, 10)).toBe(30)
    expect(chartY(5, 10)).toBe(80)
  })

  it('chartY returns baseline when max is non-positive', () => {
    expect(chartY(5, 0)).toBe(CHART_Y_BASE)
  })

  it('chartX centers a single point', () => {
    expect(chartX(0, 1)).toBe((CHART_X_START + CHART_X_END) / 2)
  })

  it('chartX distributes six points across the chart width', () => {
    expect(chartX(0, 6)).toBe(CHART_X_START)
    expect(chartX(5, 6)).toBe(CHART_X_END)
    expect(chartX(3, 6)).toBe(CHART_X_START + ((CHART_X_END - CHART_X_START) * 3) / 5)
  })

  it('leaves room between the y-axis tick and the first value label', () => {
    expect(CHART_X_START - CHART_TICK_X).toBeGreaterThanOrEqual(14)
  })
})

describe('stats-chart series', () => {
  it('buildMaxRepsPoints keeps only the last six positive values', () => {
    const records = Array.from({ length: 20 }, (_, i) =>
      workout(addDays('2026-01-01', i * 2), 5 + (i % 10)),
    ).reverse()
    const points = buildMaxRepsPoints(records)
    expect(points).toHaveLength(6)
    expect(points[0].date).toBe(addDays('2026-01-01', 14 * 2))
    expect(points[5].date).toBe(addDays('2026-01-01', 19 * 2))
  })

  it('buildMaxRepsPoints uses test set done for test records', () => {
    const records: WorkoutRecord[] = [
      {
        ...workout('2026-08-01', 0, 0),
        kind: 'test',
        sets: [{ position: 1, type: 'max', planned: 0, done: 12 }],
      },
    ]
    expect(buildMaxRepsPoints(records)).toEqual([{ date: '2026-08-01', value: 12 }])
  })

  it('buildWeeklyBars aggregates volume and keeps last seven weeks', () => {
    const records = Array.from({ length: 10 }, (_, week) => [
      workout(addDays('2026-01-05', week * 7), 8, 40 + week),
      workout(addDays('2026-01-07', week * 7), 9, 50 + week),
    ]).flat()
    const bars = buildWeeklyBars(records)
    expect(bars).toHaveLength(7)
    expect(bars[0].vol).toBe(40 + 3 + 50 + 3)
    expect(bars[6].vol).toBe(40 + 9 + 50 + 9)
  })

  it('sliceForDisplay limits narrow layouts to four items', () => {
    const items = [1, 2, 3, 4, 5, 6]
    expect(sliceForDisplay(items, false)).toEqual(items)
    expect(sliceForDisplay(items, true)).toEqual([3, 4, 5, 6])
    expect(sliceForDisplay([1, 2, 3], true)).toEqual([1, 2, 3])
  })
})

describe('stats-chart label visibility', () => {
  it('shouldShowChartDateLabel shows all labels for four or fewer points', () => {
    for (let i = 0; i < 4; i++) {
      expect(shouldShowChartDateLabel(i, 4, false)).toBe(true)
    }
  })

  it('shouldShowChartDateLabel thins labels for six desktop points', () => {
    const visible = Array.from({ length: 6 }, (_, i) =>
      shouldShowChartDateLabel(i, 6, false),
    )
    expect(visible).toEqual([true, false, true, false, true, true])
  })

  it('shouldShowChartValueLabel hides crowded middle labels with similar values', () => {
    const values = [10, 10, 10, 10, 10, 10, 10, 10]
    const visible = values.map((_, i) => shouldShowChartValueLabel(i, values, 10, false))
    expect(visible[0]).toBe(true)
    expect(visible[values.length - 1]).toBe(true)
    expect(visible.filter(Boolean).length).toBeLessThan(values.length)
  })

  it('shouldShowChartValueLabel keeps distinct values visible', () => {
    const values = [5, 10, 15, 20, 25, 30]
    const visible = values.map((_, i) => shouldShowChartValueLabel(i, values, 30, false))
    expect(visible.every(Boolean)).toBe(true)
  })
})
