import { describe, it, expect } from 'vitest'
import { exportHistory, exportBackup, validateBackup, defaultSettings } from './export'
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
    expect(out.schemaVersion).toBe(1)
    expect(out.records[0].programName).toBe('Pull-up Trainer')
    expect(out.records[0].context?.level).toBe('L2')
  })

  it('exports backup format', () => {
    const out = exportBackup(defaultSettings(), [], null, [sample], '1.0.0')
    expect(out.format).toBe('pullup-trainer.backup')
    expect(validateBackup(out)).toBe(true)
  })
})
