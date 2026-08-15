import { describe, it, expect } from 'vitest'
import { session, workingSets, finalMinimum, nkSeries } from './session'

describe('session generator reference tables', () => {
  it('M*=3', () => {
    expect(workingSets(3)).toEqual([3, 2, 2, 2])
    expect(nkSeries(3)).toEqual([2, 3, 4, 4, 4, 4])
  })

  it('M*=7', () => {
    expect(workingSets(7)).toEqual([5, 5, 5, 4])
    expect(nkSeries(7)).toEqual([5, 6, 7, 8, 8, 8])
  })

  it('M*=15', () => {
    expect(workingSets(15)).toEqual([11, 9, 9, 8])
    expect(nkSeries(15)).toEqual([9, 10, 11, 12, 13, 14])
  })

  it('M*=25', () => {
    expect(workingSets(25)).toEqual([18, 15, 15, 13])
    expect(nkSeries(25)).toEqual([15, 16, 17, 18, 19, 20])
  })
})

describe('session edge cases', () => {
  it('M*=1 minimum working sets', () => {
    expect(workingSets(1)).toEqual([1, 1, 1, 1])
    expect(finalMinimum(1, 1)).toBe(1)
    expect(finalMinimum(1, 6)).toBeLessThanOrEqual(2)
  })

  it('N_k capped at M*+1', () => {
    for (let m = 1; m <= 30; m++) {
      for (let k = 1; k <= 6; k++) {
        expect(finalMinimum(m, k)).toBeLessThanOrEqual(m + 1)
      }
    }
  })

  it('session returns 5 sets', () => {
    const s = session(7, 3)
    expect(s.sets).toHaveLength(5)
    expect(s.sets[4].type).toBe('max')
    expect(s.sets[4].planned).toBe(7)
  })
})
