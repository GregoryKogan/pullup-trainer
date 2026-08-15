import { describe, it, expect } from 'vitest'
import { clampRestSeconds } from '@/utils/workout-display'

describe('clampRestSeconds', () => {
  it('clamps general rest to 30–300 seconds', () => {
    expect(clampRestSeconds(0, false)).toBe(30)
    expect(clampRestSeconds(29, false)).toBe(30)
    expect(clampRestSeconds(180, false)).toBe(180)
    expect(clampRestSeconds(301, false)).toBe(300)
    expect(clampRestSeconds(999, false)).toBe(300)
  })

  it('clamps path 0 rest to 90–180 seconds', () => {
    expect(clampRestSeconds(30, true)).toBe(90)
    expect(clampRestSeconds(89, true)).toBe(90)
    expect(clampRestSeconds(120, true)).toBe(120)
    expect(clampRestSeconds(181, true)).toBe(180)
    expect(clampRestSeconds(999, true)).toBe(180)
  })
})
