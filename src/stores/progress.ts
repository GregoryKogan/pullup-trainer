import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { ActiveProgress, BuiltinLState, Path0State, Weekday, WorkoutRecord } from '@/domain/types'
import { levelFromM } from '@/domain/levels'
import { buildBuiltinScheduleSlots } from '@/domain/schedule'
import { loadProgress, saveProgress, loadAllRecords, addRecord } from '@/db/repositories/progress'
import { getCustomProgram } from '@/db/repositories/custom-programs'
import { todayLocal } from '@/utils/dates'

const DEFAULT_WEEKDAYS: Weekday[] = ['mon', 'wed', 'fri']

export const useProgressStore = defineStore('progress', () => {
  const progress = shallowRef<ActiveProgress | null>(null)
  const records = shallowRef<WorkoutRecord[]>([])

  async function hydrate() {
    progress.value = await loadProgress()
    records.value = await loadAllRecords()
  }

  async function persist() {
    await saveProgress(progress.value)
  }

  async function initFromTest(m: number) {
    const today = todayLocal()
    if (m <= 0) {
      const state: Path0State = { path: 'P0', path0Step: 1, failStreak: 0 }
      progress.value = {
        source: 'builtin',
        frequencyDays: 3,
        weekdays: DEFAULT_WEEKDAYS,
        schedule: buildBuiltinScheduleSlots(today, 1, 12, 3, DEFAULT_WEEKDAYS),
        lastWorkoutDate: null,
        state,
      }
    } else {
      const level = levelFromM(m)
      const state: BuiltinLState = {
        path: 'L',
        anchor: m,
        level,
        cycleIndex: 0,
        stepInCycle: 1,
        failStreak: 0,
        lastRetestDate: today,
        cycleBestMax: 0,
      }
      progress.value = {
        source: 'builtin',
        frequencyDays: 3,
        weekdays: DEFAULT_WEEKDAYS,
        schedule: buildBuiltinScheduleSlots(today, 1, 8, 3, DEFAULT_WEEKDAYS),
        lastWorkoutDate: null,
        state,
      }
    }
    await persist()
  }

  async function setCustomActive(programId: number, stepIndex = 0) {
    const program = await getCustomProgram(programId)
    if (!program) return
    const today = todayLocal()
    progress.value = {
      source: 'custom',
      customProgramId: programId,
      currentStepIndex: stepIndex,
      failStreak: 0,
      schedule: buildBuiltinScheduleSlots(today, stepIndex, 8, 3, DEFAULT_WEEKDAYS),
      lastWorkoutDate: null,
    }
    await persist()
  }

  async function saveRecord(record: WorkoutRecord) {
    const id = await addRecord(record)
    records.value = [{ ...record, id }, ...records.value]
  }

  function getNextSlot() {
    if (!progress.value) return null
    return progress.value.schedule[0] ?? null
  }

  async function updateProgress(data: ActiveProgress) {
    progress.value = data
    await persist()
  }

  return {
    progress,
    records,
    hydrate,
    initFromTest,
    setCustomActive,
    saveRecord,
    getNextSlot,
    updateProgress,
    persist,
  }
})
