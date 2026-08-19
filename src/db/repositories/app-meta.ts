import { APP_VERSION } from '@/constants/app'
import { SCHEMA_VERSION } from '@/domain/export'
import type { AppMeta } from '@/domain/types'
import { db } from '../database'

export async function loadAppMeta(): Promise<AppMeta | undefined> {
  return db.appMeta.get('singleton')
}

export async function ensureAppMeta(): Promise<AppMeta> {
  const existing = await loadAppMeta()
  if (existing) {
    if (existing.appVersion !== APP_VERSION || existing.schemaVersion !== SCHEMA_VERSION) {
      const updated: AppMeta = {
        ...existing,
        appVersion: APP_VERSION,
        schemaVersion: SCHEMA_VERSION,
      }
      await db.appMeta.put(updated)
      return updated
    }
    return existing
  }
  const meta: AppMeta = {
    id: 'singleton',
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
  }
  await db.appMeta.put(meta)
  return meta
}
