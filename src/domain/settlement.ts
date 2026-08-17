import type { ActiveProgress, CompletedSet, PlannedSet, WorkoutRecord } from './types'
import { session } from './session'
import { applyBuiltinLResult, computeTotals } from './progression'
import { advanceScheduleAfterWorkout, findScheduleSlotIndex, hasWorkoutRecord } from './schedule'

function plannedToSkippedSets(planned: PlannedSet[]): CompletedSet[] {
  return planned.map((p) => ({
    position: p.position,
    type: p.type,
    unit: p.unit,
    planned: p.planned,
    done: 0,
  }))
}

function buildSkippedFailRecord(
  date: string,
  sets: CompletedSet[],
  progress: ActiveProgress,
  programName: string,
): WorkoutRecord {
  const totals = computeTotals(sets)
  return {
    date,
    startedAt: `${date}T00:00:00`,
    durationSeconds: 0,
    kind: 'workout',
    program: 'builtin',
    programName,
    context: {
      level: progress.state.level,
      anchor: progress.state.anchor,
      cycleIndex: progress.state.cycleIndex,
      stepInCycle: progress.state.stepInCycle,
    },
    result: 'fail',
    sets,
    totals,
  }
}

export function settlePastMissedWorkouts(
  progress: ActiveProgress,
  records: WorkoutRecord[],
  today: string,
  programName: string,
): { progress: ActiveProgress; records: WorkoutRecord[]; newRecords: WorkoutRecord[] } {
  let currentProgress = progress
  let currentRecords = [...records]
  const newRecords: WorkoutRecord[] = []

  while (true) {
    const missedSlot = currentProgress.schedule
      .filter((s) => s.date < today && !hasWorkoutRecord(currentRecords, s.date))
      .sort((a, b) => a.date.localeCompare(b.date))[0]

    if (!missedSlot) break

    const planned = session(currentProgress.state.anchor, missedSlot.stepRef).sets
    const sets = plannedToSkippedSets(planned)
    const record = buildSkippedFailRecord(
      missedSlot.date,
      sets,
      currentProgress,
      programName,
    )
    newRecords.push(record)
    currentRecords = [...currentRecords, record]

    const slotIndex = findScheduleSlotIndex(currentProgress.schedule, missedSlot.date)
    const newState = applyBuiltinLResult(currentProgress.state, sets, planned)
    currentProgress = {
      ...currentProgress,
      state: newState,
      lastWorkoutDate: missedSlot.date,
      schedule: advanceScheduleAfterWorkout(
        currentProgress.schedule,
        slotIndex,
        false,
        newState.stepInCycle,
        currentProgress.frequencyDays,
        currentProgress.weekdays,
      ),
    }
  }

  return { progress: currentProgress, records: currentRecords, newRecords }
}
