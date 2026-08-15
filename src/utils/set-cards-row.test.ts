import { describe, it, expect } from 'vitest'
import { rowNeedsScroll } from '@/utils/set-cards-row'

describe('rowNeedsScroll', () => {
  it('returns true when content is wider than the row', () => {
    const el = { scrollWidth: 350, clientWidth: 200 } as HTMLElement
    expect(rowNeedsScroll(el)).toBe(true)
  })

  it('returns false when all content fits', () => {
    const el = { scrollWidth: 200, clientWidth: 200 } as HTMLElement
    expect(rowNeedsScroll(el)).toBe(false)
  })

  it('returns false for a missing element', () => {
    expect(rowNeedsScroll(null)).toBe(false)
  })
})
