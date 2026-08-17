import { describe, expect, it } from 'vitest'
import { APP_NAME, APP_SHORT_NAME } from './app-brand'
import en from '@/i18n/locales/en.json'
import ru from '@/i18n/locales/ru.json'

describe('app-brand', () => {
  it('defines non-empty name and short name within Android limit', () => {
    expect(APP_NAME.length).toBeGreaterThan(0)
    expect(APP_SHORT_NAME.length).toBeGreaterThan(0)
    expect(APP_SHORT_NAME.length).toBeLessThanOrEqual(12)
  })

  it('matches i18n appTitle in EN and RU', () => {
    expect(en.common.appTitle).toBe(APP_NAME)
    expect(ru.common.appTitle).toBe(APP_NAME)
  })
})
