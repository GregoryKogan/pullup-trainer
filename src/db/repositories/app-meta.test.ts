import { describe, it, expect, beforeEach } from 'vitest'
import { ensureAppMeta, loadAppMeta, BUILTIN_SEED_VERSION } from './app-meta'
import { db } from '../database'
import { APP_VERSION } from '@/constants/app'
import { SCHEMA_VERSION } from '@/domain/export'

describe('app-meta repository', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('creates singleton appMeta on first boot', async () => {
    const meta = await ensureAppMeta()
    expect(meta.appVersion).toBe(APP_VERSION)
    expect(meta.schemaVersion).toBe(SCHEMA_VERSION)
    expect(meta.builtinSeedVersion).toBe(BUILTIN_SEED_VERSION)

    const loaded = await loadAppMeta()
    expect(loaded?.id).toBe('singleton')
  })

  it('updates appVersion when app version changes', async () => {
    await db.appMeta.put({
      id: 'singleton',
      appVersion: '0.9.0',
      schemaVersion: SCHEMA_VERSION,
      builtinSeedVersion: BUILTIN_SEED_VERSION,
    })

    const meta = await ensureAppMeta()
    expect(meta.appVersion).toBe(APP_VERSION)
  })
})
