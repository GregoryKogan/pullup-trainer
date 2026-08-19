import type {
  WorkoutRecord,
  AppSettings,
  ActiveProgress,
  AppMeta,
  CompletedSet,
  SetType,
  WorkoutTotals,
} from './types'
import { toIsoOffset } from '@/utils/dates'

export const HISTORY_FORMAT = 'pullup-trainer.history'
export const BACKUP_FORMAT = 'pullup-trainer.backup'
export const SCHEMA_VERSION = 4

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
  type: 'reps' | 'max'
  planned?: number
  done: number
}

export interface HistoryRecordExport {
  date: string
  startedAt: string
  finishedAt?: string
  durationSeconds: number
  kind: 'workout' | 'test'
  program: 'builtin'
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

export function normalizeImportedSetType(raw: unknown): SetType {
  return raw === 'max' ? 'max' : 'reps'
}

export function normalizeImportedSet(raw: unknown): CompletedSet {
  const s = raw as Record<string, unknown>
  return {
    position: typeof s.position === 'number' ? s.position : 0,
    type: normalizeImportedSetType(s.type),
    planned: typeof s.planned === 'number' ? s.planned : 0,
    done: typeof s.done === 'number' ? s.done : 0,
  }
}

export function normalizeTotals(raw: unknown): WorkoutTotals {
  const t = raw as Record<string, unknown>
  return {
    volumeReps: typeof t.volumeReps === 'number' ? t.volumeReps : 0,
    maxSetReps: typeof t.maxSetReps === 'number' ? t.maxSetReps : 0,
  }
}

function normalizeHistoryRecord(r: HistoryRecordExport): HistoryRecordExport {
  return {
    ...r,
    program: 'builtin',
    sets: r.sets.map((s) => normalizeImportedSet(s)),
    totals: normalizeTotals(r.totals),
  }
}

function normalizeActiveProgress(raw: unknown): ActiveProgress | null {
  if (raw === null) return null
  if (!raw || typeof raw !== 'object') return null
  const p = raw as ActiveProgress
  if (!p.state || !Array.isArray(p.schedule) || !Array.isArray(p.weekdays)) return null
  if (p.frequencyDays !== 2 && p.frequencyDays !== 3) return null
  if (typeof p.state.lastRetestCycleIndex !== 'number') {
    return {
      ...p,
      state: { ...p.state, lastRetestCycleIndex: 0 },
    }
  }
  return p
}

export function recordToExport(r: WorkoutRecord): HistoryRecordExport {
  const base: HistoryRecordExport = {
    date: r.date,
    startedAt: r.startedAt,
    durationSeconds: r.durationSeconds,
    kind: r.kind,
    program: 'builtin',
    programName: r.programName,
    result: r.result,
    sets: r.sets.map((s) => normalizeImportedSet(s)),
    totals: normalizeTotals(r.totals),
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
      program: 'builtin',
      programName: r.programName,
      result: r.result,
      sets: [{ position: 1, type: 'max' as const, done: r.sets[0]?.done ?? 0 }],
      totals: normalizeTotals(r.totals),
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

export function validateBackup(data: unknown): data is BackupExport {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    d.format === BACKUP_FORMAT &&
    d.schemaVersion === SCHEMA_VERSION &&
    typeof d.exportedAt === 'string' &&
    typeof d.appVersion === 'string' &&
    d.settings !== undefined &&
    Array.isArray(d.history)
  )
}

export function normalizeImportedBackup(data: unknown): BackupExport | null {
  if (!validateBackup(data)) return null
  const d = data as BackupExport
  const activeProgress = normalizeActiveProgress(d.activeProgress)
  if (d.activeProgress !== null && activeProgress === null) return null
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: d.exportedAt,
    appVersion: d.appVersion,
    settings: normalizeSettings(d.settings),
    activeProgress,
    history: d.history.map((r) => normalizeHistoryRecord(r)),
  }
}

export function normalizeSettings(raw: unknown): AppSettings {
  const defaults = defaultSettings()
  if (!raw || typeof raw !== 'object') return defaults
  const s = raw as Record<string, unknown>
  return {
    id: 'singleton',
    palette: typeof s.palette === 'string' ? s.palette : defaults.palette,
    themeMode:
      s.themeMode === 'light' || s.themeMode === 'dark' || s.themeMode === 'system'
        ? s.themeMode
        : defaults.themeMode,
    restDurationSeconds:
      typeof s.restDurationSeconds === 'number' ? s.restDurationSeconds : defaults.restDurationSeconds,
    restAutoStart: typeof s.restAutoStart === 'boolean' ? s.restAutoStart : defaults.restAutoStart,
    restNotify: typeof s.restNotify === 'boolean' ? s.restNotify : defaults.restNotify,
    language: s.language === 'ru' ? 'ru' : defaults.language,
  }
}

export function defaultSettings(): AppSettings {
  return {
    id: 'singleton',
    palette: 'p01-volt',
    themeMode: 'system',
    restDurationSeconds: 180,
    restAutoStart: true,
    restNotify: true,
    language: 'en',
  }
}

export function defaultAppMeta(): AppMeta {
  return {
    id: 'singleton',
    appVersion: '1.0.0',
    schemaVersion: SCHEMA_VERSION,
  }
}
