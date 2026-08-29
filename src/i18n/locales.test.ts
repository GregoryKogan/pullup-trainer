import { describe, it, expect } from 'vitest'
import en from './locales/en.json'
import ru from './locales/ru.json'
import scienceEn from './locales/science/en.json'
import scienceRu from './locales/science/ru.json'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

function leafKeys(value: Json, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix]
  if (Array.isArray(value)) return [prefix]
  return Object.entries(value).flatMap(([key, val]) =>
    leafKeys(val as Json, prefix ? `${prefix}.${key}` : key),
  )
}

function placeholders(value: string): string[] {
  return [...new Set(value.match(/\{[^}]+\}/g) ?? [])].sort()
}

function flatStrings(value: Json, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (value === null || typeof value !== 'object') return []
  if (Array.isArray(value))
    return value.flatMap((item, i) => flatStrings(item as Json, `${prefix}[${i}]`))
  return Object.entries(value).flatMap(([key, val]) =>
    flatStrings(val as Json, prefix ? `${prefix}.${key}` : key),
  )
}

const bundles: [string, Json, Json][] = [
  ['app', en as Json, ru as Json],
  ['science', scienceEn as Json, scienceRu as Json],
]

describe.each(bundles)('%s locale parity', (_name, enBundle, ruBundle) => {
  const enKeys = leafKeys(enBundle)
  const ruKeys = leafKeys(ruBundle)

  it('RU has every EN key', () => {
    expect(enKeys.filter((k) => !ruKeys.includes(k))).toEqual([])
  })

  it('EN has every RU key', () => {
    expect(ruKeys.filter((k) => !enKeys.includes(k))).toEqual([])
  })

  it('has no empty strings', () => {
    const empty = [...flatStrings(enBundle), ...flatStrings(ruBundle)]
      .filter(([, v]) => v.trim() === '')
      .map(([k]) => k)
    expect(empty).toEqual([])
  })

  it('uses the same interpolation placeholders in both languages', () => {
    // Plural branches differ in count between EN and RU, so compare the set of
    // distinct placeholder names rather than every occurrence.
    const enStrings = new Map(flatStrings(enBundle))
    const mismatched = flatStrings(ruBundle)
      .filter(([key, ruValue]) => {
        const enValue = enStrings.get(key)
        if (enValue === undefined) return false
        return placeholders(enValue).join() !== placeholders(ruValue).join()
      })
      .map(([key]) => key)
    expect(mismatched).toEqual([])
  })
})
