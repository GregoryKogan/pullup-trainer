import type {
  WorkoutRecord,
  AppSettings,
  ActiveProgress,
  AppMeta,
} from './types'
import { toIsoOffset } from '@/utils/dates'

export const HISTORY_FORMAT = 'pullup-trainer.history'
export const BACKUP_FORMAT = 'pullup-trainer.backup'
export const SCHEMA_VERSION = 2

export interface HistoryExport {
  format: typeof HISTORY_FORMAT
  schemaVersion: number
  generatedAt: string
  appVersion: string
  language: string
  records: HistoryRecordExport[]
}

export interface HistorySetExport {
  position: number
  type: 'reps' | 'max' | 'hold' | 'negative' | 'assisted'
  unit: 'reps' | 'seconds'
  planned?: number
  done: number
}

export interface HistoryRecordExport {
  date: string
  startedAt: string
  finishedAt?: string
  durationSeconds: number
  kind: 'workout' | 'test'
  program: 'builtin' | 'custom'
  programName: string
  context?: WorkoutRecord['context']
  result: 'success' | 'fail'
  sets: HistorySetExport[]
  totals: WorkoutRecord['totals']
}

export interface BackupExport {
  format: typeof BACKUP_FORMAT
  schemaVersion: number
  exportedAt: string
  appVersion: string
  settings: AppSettings
  activeProgress: ActiveProgress | null
  history: HistoryRecordExport[]
}

export interface LegacyBackupV1 {
  format: typeof BACKUP_FORMAT
  schemaVersion: number
  settings: AppSettings
  customPrograms?: unknown[]
  activeProgress: unknown
  history: HistoryRecordExport[]
}

export function recordToExport(r: WorkoutRecord): HistoryRecordExport {
  const base: HistoryRecordExport = {
    date: r.date,
    startedAt: r.startedAt,
    durationSeconds: r.durationSeconds,
    kind: r.kind,
    program: r.program,
    programName: r.programName,
    result: r.result,
    sets: r.sets,
    totals: r.totals,
  }
  if (r.finishedAt) base.finishedAt = r.finishedAt
  if (r.context) base.context = r.context
  if (r.kind === 'test') {
    return {
      date: r.date,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      durationSeconds: r.durationSeconds,
      kind: 'test',
      program: r.program,
      programName: r.programName,
      result: r.result,
      sets: [{ position: 1, type: 'max' as const, unit: 'reps' as const, done: r.sets[0]?.done ?? 0 }],
      totals: r.totals,
    }
  }
  return base
}

export function exportHistory(
  records: WorkoutRecord[],
  appVersion: string,
  language: string,
): HistoryExport {
  return {
    format: HISTORY_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: toIsoOffset(new Date()),
    appVersion,
    language,
    records: records.map(recordToExport),
  }
}

export function exportBackup(
  settings: AppSettings,
  activeProgress: ActiveProgress | null,
  records: WorkoutRecord[],
  appVersion: string,
): BackupExport {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: toIsoOffset(new Date()),
    appVersion,
    settings,
    activeProgress,
    history: records.map(recordToExport),
  }
}

export function migrateBackupProgress(raw: unknown): ActiveProgress | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (p.source === 'custom') return null
  if (p.source === 'builtin') {
    const rest = { ...p }
    delete rest.source
    return rest as unknown as ActiveProgress
  }
  if ('state' in p && 'frequencyDays' in p && 'weekdays' in p && 'schedule' in p) {
    return p as unknown as ActiveProgress
  }
  return null
}

export function normalizeImportedBackup(data: unknown): BackupExport | null {
  if (!validateBackup(data)) return null
  const d = data as LegacyBackupV1 & BackupExport
  if (d.schemaVersion >= 2) {
    return {
      format: BACKUP_FORMAT,
      schemaVersion: d.schemaVersion,
      exportedAt: d.exportedAt ?? toIsoOffset(new Date()),
      appVersion: d.appVersion ?? '1.0.0',
      settings: d.settings,
      activeProgress: migrateBackupProgress(d.activeProgress),
      history: d.history ?? [],
    }
  }
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: d.exportedAt ?? toIsoOffset(new Date()),
    appVersion: d.appVersion ?? '1.0.0',
    settings: d.settings,
    activeProgress: migrateBackupProgress(d.activeProgress),
    history: d.history ?? [],
  }
}

export function validateBackup(data: unknown): data is BackupExport | LegacyBackupV1 {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return d.format === BACKUP_FORMAT && typeof d.schemaVersion === 'number'
}

export function validateHistory(data: unknown): data is HistoryExport {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return d.format === HISTORY_FORMAT && typeof d.schemaVersion === 'number'
}

export function defaultSettings(): AppSettings {
  return {
    id: 'singleton',
    palette: 'p01-volt',
    themeMode: 'system',
    restDurationSeconds: 180,
    restAutoStart: true,
    restVibrate: true,
    restNotify: true,
    language: 'en',
  }
}

export function defaultAppMeta(): AppMeta {
  return {
    id: 'singleton',
    appVersion: '1.0.0',
    schemaVersion: SCHEMA_VERSION,
    builtinSeedVersion: 1,
  }
}
