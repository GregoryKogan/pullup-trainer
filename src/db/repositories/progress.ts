import type { ActiveProgress } from '@/domain/types'
import { db } from '../database'

function ensureProgress(raw: ActiveProgress | null): ActiveProgress | null {
  if (!raw) return null
  if (typeof raw.state.lastRetestCycleIndex !== 'number') {
    return {
      ...raw,
      state: { ...raw.state, lastRetestCycleIndex: 0 },
    }
  }
  return raw
}

export async function loadProgress(): Promise<ActiveProgress | null> {
  const row = await db.activeProgress.get('singleton')
  return ensureProgress(row?.data ?? null)
}

export async function saveProgress(data: ActiveProgress | null): Promise<void> {
  await db.activeProgress.put({ id: 'singleton', data })
}

export async function loadAllRecords() {
  return db.workoutRecords.orderBy('date').reverse().toArray()
}

export async function addRecord(record: import('@/domain/types').WorkoutRecord): Promise<number> {
  return (await db.workoutRecords.add(record)) as number
}

export async function getRecordsByDate(date: string) {
  return db.workoutRecords.where('date').equals(date).toArray()
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.settings, db.activeProgress, db.workoutRecords, db.appMeta, async () => {
    await db.activeProgress.clear()
    await db.workoutRecords.clear()
  })
}
