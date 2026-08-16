import { describe, expect, it } from 'vitest'
import { clampRestSeconds } from './workout-display'

describe('workout-display', () => {
  it('clamps rest to 30–300 seconds', () => {
    expect(clampRestSeconds(30)).toBe(30)
    expect(clampRestSeconds(89)).toBe(89)
    expect(clampRestSeconds(180)).toBe(180)
    expect(clampRestSeconds(301)).toBe(300)
    expect(clampRestSeconds(0)).toBe(30)
  })
})
