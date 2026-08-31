import { describe, it, expect } from 'vitest'
import { formatMonthLabel } from './dates'

describe('formatMonthLabel', () => {
  it('capitalises the month and drops locale suffixes', () => {
    expect(formatMonthLabel('2026-09', 'en')).toBe('September 2026')
    expect(formatMonthLabel('2026-09', 'ru')).toBe('Сентябрь 2026')
  })

  it('keeps single-digit months aligned to the right year', () => {
    expect(formatMonthLabel('2016-01', 'en')).toBe('January 2016')
    expect(formatMonthLabel('2016-12', 'ru')).toBe('Декабрь 2016')
  })
})
