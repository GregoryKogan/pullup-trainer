import { db } from '../database'
import type { AppSettings } from '@/domain/types'
import { defaultSettings, normalizeSettings } from '@/domain/export'

export async function loadSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('singleton')
  if (existing) {
    const migrated = normalizeSettings(existing)
    const legacy = existing as AppSettings & { restVibrate?: boolean }
    if (legacy.restVibrate !== undefined || migrated.restNotify !== existing.restNotify) {
      await db.settings.put(migrated)
    }
    return migrated
  }
  const s = defaultSettings()
  await db.settings.put(s)
  return s
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put(settings)
}
