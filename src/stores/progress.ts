import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { ActiveProgress, BuiltinLState, Path0State, Weekday, WorkoutRecord } from '@/domain/types'
import { buildBuiltinScheduleSlots, buildCustomScheduleSlots } from '@/domain/schedule'
import { levelFromM } from '@/domain/levels'
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
      schedule: buildCustomScheduleSlots(today, program.steps, stepIndex, 8),
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

  async function updateBuiltinScheduleSettings(frequencyDays: 2 | 3, weekdays: Weekday[]) {
    const p = progress.value
    if (!p || p.source !== 'builtin') return
    const stepRef = p.schedule[0]?.stepRef ?? 1
    const count = Math.max(p.schedule.length, 8)
    progress.value = {
      ...p,
      frequencyDays,
      weekdays,
      schedule: buildBuiltinScheduleSlots(todayLocal(), stepRef, count, frequencyDays, weekdays),
    }
    await persist()
  }

  async function applyRetest(m: number) {
    const p = progress.value
    if (!p || p.source !== 'builtin') return
    const today = todayLocal()
    if (m <= 0) {
      progress.value = {
        source: 'builtin',
        frequencyDays: p.frequencyDays,
        weekdays: p.weekdays,
        schedule: buildBuiltinScheduleSlots(today, 1, 12, p.frequencyDays, p.weekdays),
        lastWorkoutDate: p.lastWorkoutDate,
        state: { path: 'P0', path0Step: 1, failStreak: 0 },
      }
    } else {
      const level = levelFromM(m)
      progress.value = {
        source: 'builtin',
        frequencyDays: p.frequencyDays,
        weekdays: p.weekdays,
        schedule: buildBuiltinScheduleSlots(today, 1, 8, p.frequencyDays, p.weekdays),
        lastWorkoutDate: p.lastWorkoutDate,
        state: {
          path: 'L',
          anchor: m,
          level,
          cycleIndex: 0,
          stepInCycle: 1,
          failStreak: 0,
          lastRetestDate: today,
          cycleBestMax: 0,
        },
      }
    }
    await persist()
  }

  async function reduceAnchor() {
    const p = progress.value
    if (!p || p.source !== 'builtin' || p.state.path !== 'L') return
    const anchor = Math.max(1, Math.floor(p.state.anchor * 0.9))
    progress.value = {
      ...p,
      state: {
        ...p.state,
        anchor,
        level: levelFromM(anchor),
        stepInCycle: 1,
        failStreak: 0,
        lastRetestDate: todayLocal(),
      },
    }
    await persist()
  }

  function getMissedSlot() {
    if (!progress.value) return null
    const today = todayLocal()
    const completed = new Set(
      records.value.filter((r) => r.kind === 'workout' && r.result === 'success').map((r) => r.date),
    )
    const idx = progress.value.schedule.findIndex((s) => s.date < today && !completed.has(s.date))
    if (idx < 0) return null
    return { ...progress.value.schedule[idx], index: idx }
  }

  async function activateBuiltin() {
    const testRec = records.value.find((r) => r.kind === 'test')
    const m = testRec?.sets[0]?.done ?? 7
    await applyRetest(m)
  }

  return {
    progress,
    records,
    hydrate,
    initFromTest,
    setCustomActive,
    activateBuiltin,
    saveRecord,
    getNextSlot,
    updateProgress,
    updateBuiltinScheduleSettings,
    applyRetest,
    reduceAnchor,
    getMissedSlot,
    persist,
  }
})
