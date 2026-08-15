import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { CompletedSet, PlannedSet } from '@/domain/types'

export interface ActiveWorkout {
  date: string
  startedAt: string
  planned: PlannedSet[]
  completed: CompletedSet[]
  currentIndex: number
  programName: string
  program: 'builtin' | 'custom'
}

export interface WorkoutResultSummary {
  result: 'success' | 'fail'
  volume: number
  planned: number
  done: number
  nextStep?: number
  date?: string
}

export const useWorkoutSessionStore = defineStore('workoutSession', () => {
  const active = shallowRef<ActiveWorkout | null>(null)
  const restRunning = shallowRef(false)
  const lastResult = shallowRef<WorkoutResultSummary | null>(null)

  function start(session: {
    date: string
    planned: PlannedSet[]
    programName: string
    program: 'builtin' | 'custom'
    startedAt: string
  }) {
    active.value = {
      ...session,
      completed: [],
      currentIndex: 0,
    }
  }

  function completeSet(done: number) {
    if (!active.value) return
    const idx = active.value.currentIndex
    const p = active.value.planned[idx]
    const completed: CompletedSet[] = [
      ...active.value.completed,
      {
        position: p.position,
        type: p.type,
        unit: p.unit,
        planned: p.planned,
        done,
      },
    ]
    const hasMore = idx < active.value.planned.length - 1
    active.value = {
      ...active.value,
      completed,
      currentIndex: hasMore ? idx + 1 : idx,
    }
    if (hasMore) restRunning.value = true
  }

  function clear() {
    active.value = null
    restRunning.value = false
  }

  function setLastResult(summary: WorkoutResultSummary) {
    lastResult.value = summary
  }

  function isComplete() {
    return active.value !== null && active.value.completed.length === active.value.planned.length
  }

  return { active, restRunning, lastResult, start, completeSet, clear, setLastResult, isComplete }
})
