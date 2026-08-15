import { db } from '../database'
import type { AppSettings } from '@/domain/types'
import { defaultSettings } from '@/domain/export'

export async function loadSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('singleton')
  if (existing) return existing
  const s = defaultSettings()
  await db.settings.put(s)
  return s
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put(settings)
}
