import { db } from '../database'
import type { ActiveProgress, WorkoutRecord } from '@/domain/types'

function normalizeProgress(raw: unknown): ActiveProgress | null {
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

export async function loadProgress(): Promise<ActiveProgress | null> {
  const row = await db.activeProgress.get('singleton')
  return normalizeProgress(row?.data ?? null)
}

export async function saveProgress(data: ActiveProgress | null): Promise<void> {
  await db.activeProgress.put({ id: 'singleton', data })
}

export async function loadAllRecords(): Promise<WorkoutRecord[]> {
  return db.workoutRecords.orderBy('date').reverse().toArray()
}

export async function addRecord(record: WorkoutRecord): Promise<number> {
  return (await db.workoutRecords.add(record)) as number
}

export async function getRecordsByDate(date: string): Promise<WorkoutRecord[]> {
  return db.workoutRecords.where('date').equals(date).toArray()
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.settings, db.activeProgress, db.workoutRecords, db.appMeta, async () => {
    await db.activeProgress.clear()
    await db.workoutRecords.clear()
  })
}
