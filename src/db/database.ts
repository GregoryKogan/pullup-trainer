import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  AppMeta,
  ActiveProgress,
  WorkoutRecord,
} from '@/domain/types'

export class PullupDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  activeProgress!: EntityTable<{ id: 'singleton'; data: ActiveProgress | null }, 'id'>
  workoutRecords!: EntityTable<WorkoutRecord, 'id'>
  appMeta!: EntityTable<AppMeta, 'id'>

  constructor() {
    super('PullupTrainer')
    this.version(4).stores({
      settings: 'id',
      activeProgress: 'id',
      workoutRecords: '++id, date',
      appMeta: 'id',
    })
  }
}

export const db = new PullupDatabase()
