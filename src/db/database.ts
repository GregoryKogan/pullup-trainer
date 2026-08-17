import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  AppMeta,
  ActiveProgress,
  WorkoutRecord,
} from '@/domain/types'
import { normalizeImportedSet, normalizeTotals } from '@/domain/export'

export class PullupDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
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
    this.version(2).stores({
      settings: 'id',
      activeProgress: 'id',
      workoutRecords: '++id, date',
      appMeta: 'id',
    })
    this.version(3)
      .stores({
        settings: 'id',
        activeProgress: 'id',
        workoutRecords: '++id, date',
        appMeta: 'id',
      })
      .upgrade(async (tx) => {
        const records = await tx.table('workoutRecords').toArray()
        for (const record of records) {
          await tx.table('workoutRecords').put({
            ...record,
            sets: (record.sets ?? []).map((s: unknown) => normalizeImportedSet(s)),
            totals: normalizeTotals(record.totals),
          })
        }
      })
  }
}

export const db = new PullupDatabase()
