import type { ActiveProgress } from '@/domain/types'
import { db } from '../database'

function normalizeProgress(raw: unknown): ActiveProgress | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (p.source === 'custom') return null
  let progress: ActiveProgress | null = null
  if (p.source === 'builtin') {
    const rest = { ...p }
    delete rest.source
    progress = rest as unknown as ActiveProgress
  } else if ('state' in p && 'frequencyDays' in p && 'weekdays' in p && 'schedule' in p) {
    progress = p as unknown as ActiveProgress
  }
  if (!progress) return null
  const state = progress.state as unknown as Record<string, unknown>
  if (state.path === 'P0') return null
  if ('path' in state) {
    const rest = { ...state }
    delete rest.path
    progress = { ...progress, state: rest as unknown as ActiveProgress['state'] }
  }
  return progress
}

export async function loadProgress(): Promise<ActiveProgress | null> {
  const row = await db.activeProgress.get('singleton')
  return normalizeProgress(row?.data ?? null)
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
