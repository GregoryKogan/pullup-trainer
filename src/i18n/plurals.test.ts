import { describe, it, expect } from 'vitest'
import { i18n } from './index'

describe('pluralization', () => {
  const t = (n: number, locale: 'en' | 'ru') =>
    i18n.global.t('settings.weekdaysLimit', n, { locale })

  it('picks Russian one/few/many forms correctly', () => {
    expect([0, 1, 2, 4, 5, 11, 14, 21, 22, 25, 101, 111].map((n) => t(n, 'ru'))).toEqual([
      'Выбери 0 дней',
      'Выбери 1 день',
      'Выбери 2 дня',
      'Выбери 4 дня',
      'Выбери 5 дней',
      'Выбери 11 дней',
      'Выбери 14 дней',
      'Выбери 21 день',
      'Выбери 22 дня',
      'Выбери 25 дней',
      'Выбери 101 день',
      'Выбери 111 дней',
    ])
  })

  it('leaves English pluralization on the default rule', () => {
    expect([1, 2, 5].map((n) => t(n, 'en'))).toEqual(['Pick 1 day', 'Pick 2 days', 'Pick 5 days'])
  })
})
