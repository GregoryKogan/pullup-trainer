import { describe, it, expect } from 'vitest'
import { levelFromM } from './levels'

describe('levelFromM', () => {
  it('maps M thresholds to L1–L4', () => {
    expect(levelFromM(1)).toBe('L1')
    expect(levelFromM(4)).toBe('L1')
    expect(levelFromM(5)).toBe('L2')
    expect(levelFromM(9)).toBe('L2')
    expect(levelFromM(10)).toBe('L3')
    expect(levelFromM(19)).toBe('L3')
    expect(levelFromM(20)).toBe('L4')
    expect(levelFromM(25)).toBe('L4')
  })
})
