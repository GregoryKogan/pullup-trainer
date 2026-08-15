import type { PlannedSet, SetType } from '@/domain/types'
import {
  REST_MAX_SECONDS,
  REST_MIN_SECONDS,
  REST_P0_MAX_SECONDS,
  REST_P0_MIN_SECONDS,
} from '@/constants/app'

export function setTypeLabelKey(type: SetType): string {
  const map: Record<SetType, string> = {
    reps: 'workout.setType.reps',
    max: 'workout.setType.max',
    hold: 'workout.setType.hold',
    negative: 'workout.setType.negative',
    assisted: 'workout.setType.assisted',
  }
  return map[type]
}

export function unitLabelKey(unit: PlannedSet['unit']): string {
  return unit === 'seconds' ? 'workout.seconds' : 'workout.reps'
}

export function doneButtonKey(set: PlannedSet): string {
  if (set.type === 'max') return 'workout.doneMax'
  if (set.unit === 'seconds') return 'workout.doneSeconds'
  return 'workout.doneReps'
}

export function focusSubtitleKey(set: PlannedSet): string {
  if (set.type === 'max') return 'workout.focusMax'
  if (set.type === 'assisted') return 'workout.focusAssisted'
  if (set.unit === 'seconds') return 'workout.focusSeconds'
  return 'workout.focusReps'
}

export function clampRestSeconds(seconds: number, pathP0: boolean): number {
  if (pathP0) {
    return Math.min(REST_P0_MAX_SECONDS, Math.max(REST_P0_MIN_SECONDS, seconds))
  }
  return Math.min(REST_MAX_SECONDS, Math.max(REST_MIN_SECONDS, seconds))
}
