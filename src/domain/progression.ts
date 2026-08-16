import type {
  CompletedSet,
  PlannedSet,
  WorkoutResult,
  BuiltinLState,
} from './types'
import { levelFromM } from './levels'
import { daysBetween } from '@/utils/dates'

export function evaluateWorkout(sets: CompletedSet[], planned: PlannedSet[]): WorkoutResult {
  for (const p of planned) {
    const done = sets.find((s) => s.position === p.position)?.done ?? 0
    if (done < p.planned) return 'fail'
  }
  return 'success'
}

export function computeTotals(sets: CompletedSet[]) {
  let volumeReps = 0
  let maxSetReps = 0
  let holdSeconds = 0
  for (const s of sets) {
    if (s.unit === 'reps') {
      volumeReps += s.done
      maxSetReps = Math.max(maxSetReps, s.done)
    } else {
      holdSeconds += s.done
    }
  }
  return { volumeReps, maxSetReps, holdSeconds }
}

export function deloadAnchor(anchor: number): number {
  return Math.max(1, Math.floor(0.9 * anchor))
}

export function applyBuiltinLResult(
  state: BuiltinLState,
  sets: CompletedSet[],
  planned: PlannedSet[],
): BuiltinLState {
  const result = evaluateWorkout(sets, planned)
  const finalSet = sets.find((s) => s.position === 5)
  const finalDone = finalSet?.done ?? 0
  const cycleBestMax = Math.max(state.cycleBestMax, finalDone)

  if (result === 'fail') {
    const failStreak = state.failStreak + 1
    if (failStreak >= 2) {
      const anchor = deloadAnchor(state.anchor)
      return {
        ...state,
        anchor,
        level: levelFromM(anchor),
        failStreak: 0,
        cycleBestMax: 0,
      }
    }
    return { ...state, failStreak, cycleBestMax }
  }

  const nextStep = state.stepInCycle + 1
  if (nextStep <= 6) {
    return {
      ...state,
      stepInCycle: nextStep,
      failStreak: 0,
      cycleBestMax,
    }
  }

  const newAnchor = Math.max(cycleBestMax, state.anchor - 1)
  return {
    ...state,
    anchor: newAnchor,
    level: levelFromM(newAnchor),
    cycleIndex: state.cycleIndex + 1,
    stepInCycle: 1,
    failStreak: 0,
    cycleBestMax: 0,
  }
}

export function needsRetest(
  cycleIndex: number,
  lastRetestCycleIndex: number,
  today: string,
  lastWorkoutDate: string | null,
): boolean {
  if (lastWorkoutDate) {
    const gap = daysBetween(lastWorkoutDate, today)
    if (gap > 14) return true
  }
  if (cycleIndex >= 2 && cycleIndex % 2 === 0 && cycleIndex > lastRetestCycleIndex) {
    return true
  }
  return false
}
