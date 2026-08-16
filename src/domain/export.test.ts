import { describe, it, expect } from 'vitest'
import {
  exportHistory,
  exportBackup,
  validateBackup,
  migrateBackupProgress,
  normalizeImportedBackup,
  defaultSettings,
  SCHEMA_VERSION,
} from './export'
import type { WorkoutRecord } from './types'

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
      { position: 1, type: 'reps', unit: 'reps', planned: 5, done: 5 },
      { position: 5, type: 'max', unit: 'reps', planned: 7, done: 8 },
    ],
    totals: { volumeReps: 27, maxSetReps: 8, holdSeconds: 0 },
  }

  it('exports history format', () => {
    const out = exportHistory([sample], '1.0.0', 'en')
    expect(out.format).toBe('pullup-trainer.history')
    expect(out.schemaVersion).toBe(SCHEMA_VERSION)
    expect(out.records[0].programName).toBe('Pull-up Trainer')
    expect(out.records[0].context?.level).toBe('L2')
  })

  it('exports backup format', () => {
    const out = exportBackup(defaultSettings(), null, [sample], '1.0.0')
    expect(out.format).toBe('pullup-trainer.backup')
    expect(out.schemaVersion).toBe(3)
    expect(validateBackup(out)).toBe(true)
    expect('customPrograms' in out).toBe(false)
  })

  it('migrateBackupProgress rejects custom activeProgress', () => {
    expect(
      migrateBackupProgress({
        source: 'custom',
        customProgramId: 1,
        currentStepIndex: 0,
        failStreak: 0,
        schedule: [],
        lastWorkoutDate: null,
      }),
    ).toBeNull()
  })

  it('migrateBackupProgress rejects P0 legacy progress', () => {
    expect(
      migrateBackupProgress({
        frequencyDays: 3,
        weekdays: ['mon', 'wed', 'fri'],
        schedule: [{ date: '2026-08-01', stepRef: 1 }],
        lastWorkoutDate: null,
        state: { path: 'P0', path0Step: 1, failStreak: 0 },
      }),
    ).toBeNull()
  })

  it('migrateBackupProgress strips path from legacy L state', () => {
    const migrated = migrateBackupProgress({
      source: 'builtin',
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
        cycleBestMax: 0,
      },
    })
    expect(migrated).not.toBeNull()
    expect(migrated && 'source' in migrated).toBe(false)
  })

  it('normalizeImportedBackup ignores legacy customPrograms', () => {
    const legacy = {
      format: 'pullup-trainer.backup',
      schemaVersion: 1,
      exportedAt: '2026-08-01T00:00:00+03:00',
      appVersion: '1.0.0',
      settings: defaultSettings(),
      customPrograms: [{ id: 1, name: 'Test', steps: [] }],
      activeProgress: {
        source: 'custom',
        customProgramId: 1,
        currentStepIndex: 0,
        failStreak: 0,
        schedule: [],
        lastWorkoutDate: null,
      },
      history: [],
    }
    const normalized = normalizeImportedBackup(legacy)
    expect(normalized?.activeProgress).toBeNull()
    expect(normalized?.schemaVersion).toBe(3)
  })
})
