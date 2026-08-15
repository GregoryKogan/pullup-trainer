import type { PlannedSet, SetType } from '@/domain/types'

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
  if (!pathP0) return seconds
  return Math.min(180, Math.max(90, seconds))
}
