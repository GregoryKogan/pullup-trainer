import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { loadSettings, saveSettings } from '@/db/repositories/settings'
import { defaultSettings } from '@/domain/export'

describe('database', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('persists settings singleton', async () => {
    const s = defaultSettings()
    s.restDurationSeconds = 120
    await saveSettings(s)
    const loaded = await loadSettings()
    expect(loaded.restDurationSeconds).toBe(120)
  })
})
