export type SetType = 'reps' | 'max'
export type WorkoutResult = 'success' | 'fail'
export type Level = 'L1' | 'L2' | 'L3' | 'L4'
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type ThemeMode = 'light' | 'dark' | 'system'
export type RecordKind = 'workout' | 'test'

export interface PlannedSet {
  position: number
  type: SetType
  planned: number
  label?: string
}

export interface WorkoutSession {
  sets: PlannedSet[]
}

export interface CompletedSet {
  position: number
  type: SetType
  planned: number
  done: number
}

export interface ScheduleSlot {
  date: string
  stepRef: number
}

export interface BuiltinLState {
  anchor: number
  level: Level
  cycleIndex: number
  stepInCycle: number
  failStreak: number
  lastRetestDate: string | null
  lastRetestCycleIndex: number
  cycleBestMax: number
}

export interface ActiveProgress {
  frequencyDays: 2 | 3
  weekdays: Weekday[]
  schedule: ScheduleSlot[]
  lastWorkoutDate: string | null
  state: BuiltinLState
}

export interface WorkoutRecordContextL {
  level: Level
  anchor: number
  cycleIndex: number
  stepInCycle: number
}

export interface WorkoutTotals {
  volumeReps: number
  maxSetReps: number
}

export interface WorkoutRecord {
  id?: number
  date: string
  startedAt: string
  finishedAt?: string
  durationSeconds: number
  kind: RecordKind
  program: 'builtin'
  programName: string
  context?: WorkoutRecordContextL
  result: WorkoutResult
  sets: CompletedSet[]
  totals: WorkoutTotals
}

export interface AppSettings {
  id: 'singleton'
  palette: string
  themeMode: ThemeMode
  restDurationSeconds: number
  restAutoStart: boolean
  restNotify: boolean
  language: 'en' | 'ru'
}

export interface AppMeta {
  id: 'singleton'
  appVersion: string
  schemaVersion: number
}

export interface StartRecommendation {
  anchor: number
  level: Level
  explanationKey: string
  explanationParams: Record<string, number | string>
}

export type ReturnPolicy = 'continue' | 'retest'
