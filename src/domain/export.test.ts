import { describe, it, expect } from 'vitest'
import {
  exportHistory,
  exportBackup,
  validateBackup,
  normalizeImportedBackup,
  normalizeImportedSet,
  normalizeTotals,
  normalizeSettings,
  defaultSettings,
  SCHEMA_VERSION,
} from './export'
import type { WorkoutRecord, ActiveProgress } from './types'

describe('export', () => {
  const sample: WorkoutRecord = {
    date: '2026-08-14',
    startedAt: '2026-08-14T18:02:11+03:00',
    finishedAt: '2026-08-14T18:26:45+03:00',
    durationSeconds: 1474,
    kind: 'workout',
    program: 'builtin',
    programName: 'Pull-up Trainer',
    context: { level: 'L2', anchor: 7, cycleIndex: 2, stepInCycle: 3 },
    result: 'success',
    sets: [
      { position: 1, type: 'reps', planned: 5, done: 5 },
      { position: 5, type: 'max', planned: 7, done: 8 },
    ],
    totals: { volumeReps: 27, maxSetReps: 8 },
  }

  const validProgress: ActiveProgress = {
    frequencyDays: 3,
    weekdays: ['mon', 'wed', 'fri'],
    schedule: [{ date: '2026-08-01', stepRef: 1 }],
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
  }

  it('exports history format', () => {
    const out = exportHistory([sample], '1.0.0', 'en')
    expect(out.format).toBe('pullup-trainer.history')
    expect(out.schemaVersion).toBe(SCHEMA_VERSION)
    expect(out.records[0].programName).toBe('Pull-up Trainer')
    expect(out.records[0].context?.level).toBe('L2')
    expect(out.records[0].sets[0]).not.toHaveProperty('unit')
    expect(out.records[0].totals).toEqual({ volumeReps: 27, maxSetReps: 8 })
  })

  it('exports backup format', () => {
    const out = exportBackup(defaultSettings(), null, [sample], '1.0.0')
    expect(out.format).toBe('pullup-trainer.backup')
    expect(out.schemaVersion).toBe(4)
    expect(validateBackup(out)).toBe(true)
  })

  it('normalizeImportedSet coerces unknown types to reps', () => {
    expect(
      normalizeImportedSet({
        position: 1,
        type: 'unknown',
        planned: 5,
        done: 5,
      }),
    ).toEqual({ position: 1, type: 'reps', planned: 5, done: 5 })
  })

  it('normalizeTotals keeps only volumeReps and maxSetReps', () => {
    expect(normalizeTotals({ volumeReps: 10, maxSetReps: 5, extra: 120 })).toEqual({
      volumeReps: 10,
      maxSetReps: 5,
    })
  })

  it('validateBackup rejects non-v4 schemaVersion', () => {
    expect(
      validateBackup({
        format: 'pullup-trainer.backup',
        schemaVersion: 1,
        exportedAt: '2026-08-01T00:00:00+03:00',
        appVersion: '1.0.0',
        settings: defaultSettings(),
        activeProgress: null,
        history: [],
      }),
    ).toBe(false)
  })

  it('normalizeImportedBackup rejects invalid activeProgress', () => {
    const backup = {
      format: 'pullup-trainer.backup',
      schemaVersion: 4,
      exportedAt: '2026-08-01T00:00:00+03:00',
      appVersion: '1.0.0',
      settings: defaultSettings(),
      activeProgress: { invalid: true },
      history: [],
    }
    expect(normalizeImportedBackup(backup)).toBeNull()
  })

  it('normalizeImportedBackup accepts valid v4 backup', () => {
    const backup = exportBackup(defaultSettings(), validProgress, [sample], '1.0.0')
    const normalized = normalizeImportedBackup(backup)
    expect(normalized?.schemaVersion).toBe(4)
    expect(normalized?.activeProgress?.state.anchor).toBe(7)
    expect(normalized?.history[0].sets[0].type).toBe('reps')
  })

  it('normalizeImportedBackup defaults missing lastRetestCycleIndex', () => {
    const progress = {
      ...validProgress,
      state: {
        ...validProgress.state,
        lastRetestCycleIndex: undefined,
      },
    }
    const backup = {
      format: 'pullup-trainer.backup',
      schemaVersion: 4,
      exportedAt: '2026-08-01T00:00:00+03:00',
      appVersion: '1.0.0',
      settings: defaultSettings(),
      activeProgress: progress,
      history: [],
    }
    const normalized = normalizeImportedBackup(backup)
    expect(normalized?.activeProgress?.state.lastRetestCycleIndex).toBe(0)
  })

  it('normalizeSettings fills missing fields from defaults', () => {
    expect(normalizeSettings({ palette: 'p03-cobalt' }).palette).toBe('p03-cobalt')
    expect(normalizeSettings({ palette: 'p03-cobalt' }).restNotify).toBe(true)
  })
})
