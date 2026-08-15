import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  AppMeta,
  CustomProgram,
  ActiveProgress,
  WorkoutRecord,
} from '@/domain/types'

export class PullupDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  customPrograms!: EntityTable<CustomProgram, 'id'>
  activeProgress!: EntityTable<{ id: 'singleton'; data: ActiveProgress | null }, 'id'>
  workoutRecords!: EntityTable<WorkoutRecord, 'id'>
  appMeta!: EntityTable<AppMeta, 'id'>

  constructor() {
    super('PullupTrainer')
    this.version(1).stores({
      settings: 'id',
      customPrograms: '++id',
      activeProgress: 'id',
      workoutRecords: '++id, date',
      appMeta: 'id',
    })
  }
}

export const db = new PullupDatabase()
