import { describe, it, expect } from 'vitest'
import type { BuiltinLState, CompletedSet, PlannedSet } from './types'
import {
  evaluateWorkout,
  deloadAnchor,
  applyBuiltinLResult,
  needsRetest,
} from './progression'
import { session } from './session'

function baseState(overrides: Partial<BuiltinLState> = {}): BuiltinLState {
  return {
    anchor: 7,
    level: 'L2',
    cycleIndex: 0,
    stepInCycle: 1,
    failStreak: 0,
    lastRetestDate: '2026-08-01',
    lastRetestCycleIndex: 0,
    cycleBestMax: 0,
    ...overrides,
  }
}

function completeAll(planned: PlannedSet[], finalDone?: number): CompletedSet[] {
  return planned.map((p) => ({
    position: p.position,
    type: p.type,
    planned: p.planned,
    done: p.type === 'max' && finalDone !== undefined ? finalDone : p.planned,
  }))
}

describe('evaluateWorkout', () => {
  it('returns success when all sets meet planned reps', () => {
    const planned = session(7, 3).sets
    expect(evaluateWorkout(completeAll(planned), planned)).toBe('success')
  })

  it('returns fail when a working set is short', () => {
    const planned = session(7, 1).sets
    const sets = completeAll(planned)
    sets[0] = { ...sets[0], done: sets[0].planned - 1 }
    expect(evaluateWorkout(sets, planned)).toBe('fail')
  })

  it('returns fail when final max is below minimum', () => {
    const planned = session(7, 3).sets
    const sets = completeAll(planned, planned[4].planned - 1)
    expect(evaluateWorkout(sets, planned)).toBe('fail')
  })
})

describe('deloadAnchor', () => {
  it('applies floor(0.9·M*) with minimum 1', () => {
    expect(deloadAnchor(7)).toBe(6)
    expect(deloadAnchor(3)).toBe(2)
    expect(deloadAnchor(1)).toBe(1)
  })
})

describe('applyBuiltinLResult', () => {
  it('advances step on success', () => {
    const state = baseState({ stepInCycle: 2 })
    const planned = session(7, 2).sets
    const next = applyBuiltinLResult(state, completeAll(planned), planned)
    expect(next.stepInCycle).toBe(3)
    expect(next.failStreak).toBe(0)
  })

  it('repeats step on fail and increments failStreak', () => {
    const state = baseState({ stepInCycle: 3 })
    const planned = session(7, 3).sets
    const sets = completeAll(planned, planned[4].planned - 1)
    const next = applyBuiltinLResult(state, sets, planned)
    expect(next.stepInCycle).toBe(3)
    expect(next.failStreak).toBe(1)
  })

  it('deloads after two consecutive fails on the same step', () => {
    const state = baseState({ stepInCycle: 3, failStreak: 1 })
    const planned = session(7, 3).sets
    const sets = completeAll(planned, planned[4].planned - 1)
    const next = applyBuiltinLResult(state, sets, planned)
    expect(next.anchor).toBe(6)
    expect(next.level).toBe('L2')
    expect(next.stepInCycle).toBe(3)
    expect(next.failStreak).toBe(0)
    expect(next.cycleBestMax).toBe(0)
  })

  it('ends cycle with M*\' = max(cycle best final, M* - 1)', () => {
    const state = baseState({ stepInCycle: 6, cycleBestMax: 7 })
    const planned = session(7, 6).sets
    const sets = completeAll(planned, 8)
    const next = applyBuiltinLResult(state, sets, planned)
    expect(next.anchor).toBe(8)
    expect(next.level).toBe('L2')
    expect(next.cycleIndex).toBe(1)
    expect(next.stepInCycle).toBe(1)
    expect(next.cycleBestMax).toBe(0)
  })

  it('updates level when anchor crosses threshold after cycle end', () => {
    const state = baseState({ anchor: 9, level: 'L2', stepInCycle: 6, cycleBestMax: 10 })
    const planned = session(9, 6).sets
    const sets = completeAll(planned, 10)
    const next = applyBuiltinLResult(state, sets, planned)
    expect(next.anchor).toBe(10)
    expect(next.level).toBe('L3')
  })
})

describe('needsRetest', () => {
  it('prompts after break longer than 14 days', () => {
    expect(needsRetest(0, 0, '2026-08-16', '2026-07-01')).toBe(true)
    expect(needsRetest(0, 0, '2026-08-16', '2026-07-01', '2026-08-16')).toBe(false)
  })

  it('does not prompt within 14 days without cycle milestone', () => {
    expect(needsRetest(1, 0, '2026-08-16', '2026-08-10')).toBe(false)
  })

  it('prompts every two completed cycles', () => {
    expect(needsRetest(2, 0, '2026-08-16', '2026-08-15')).toBe(true)
    expect(needsRetest(4, 2, '2026-08-16', '2026-08-15')).toBe(true)
  })

  it('does not re-prompt after cycle retest was addressed', () => {
    expect(needsRetest(2, 2, '2026-08-16', '2026-08-15')).toBe(false)
  })
})
