import { describe, expect, it } from 'vitest'
import {
  isValidRepCount,
  isValidTestRepCount,
  normalizeRepCount,
  clampRepCount,
  clampTestRepCount,
} from './reps-input'

describe('reps-input', () => {
  it('accepts whole rep counts in range', () => {
    expect(isValidRepCount(0)).toBe(true)
    expect(isValidRepCount(7)).toBe(true)
    expect(isValidRepCount(100)).toBe(true)
  })

  it('accepts test rep counts from 1', () => {
    expect(isValidTestRepCount(0)).toBe(false)
    expect(isValidTestRepCount(1)).toBe(true)
    expect(isValidTestRepCount(7)).toBe(true)
  })

  it('rejects fractions and out-of-range values', () => {
    expect(isValidRepCount(0.23423)).toBe(false)
    expect(isValidRepCount(-1)).toBe(false)
    expect(isValidRepCount(101)).toBe(false)
    expect(isValidRepCount(Number.NaN)).toBe(false)
  })

  it('truncates fractional input strings', () => {
    expect(normalizeRepCount('0.23423')).toBe(0)
    expect(normalizeRepCount('7.9')).toBe(7)
    expect(normalizeRepCount('100.5')).toBe(100)
  })

  it('clamps rep counts to the allowed range', () => {
    expect(clampRepCount(-3)).toBe(0)
    expect(clampRepCount(7.9)).toBe(7)
    expect(clampRepCount(150)).toBe(100)
  })

  it('clamps test rep counts with minimum 1', () => {
    expect(clampTestRepCount(0)).toBe(1)
    expect(clampTestRepCount(-3)).toBe(1)
    expect(clampTestRepCount(7.9)).toBe(7)
  })
})
