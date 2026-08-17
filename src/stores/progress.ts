import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { ActiveProgress, BuiltinLState, Weekday, WorkoutRecord } from '@/domain/types'
import { buildBuiltinScheduleSlots } from '@/domain/schedule'
import { levelFromM } from '@/domain/levels'
import { loadProgress, saveProgress, loadAllRecords, addRecord } from '@/db/repositories/progress'
import { todayLocal } from '@/utils/dates'

const DEFAULT_WEEKDAYS: Weekday[] = ['mon', 'wed', 'fri']

function createState(m: number, today: string): BuiltinLState {
  return {
    anchor: m,
    level: levelFromM(m),
    cycleIndex: 0,
    stepInCycle: 1,
    failStreak: 0,
    lastRetestDate: today,
    lastRetestCycleIndex: 0,
    cycleBestMax: 0,
  }
}

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
    if (m < 1) return
    const today = todayLocal()
    progress.value = {
      frequencyDays: 3,
      weekdays: DEFAULT_WEEKDAYS,
      schedule: buildBuiltinScheduleSlots(today, 1, 8, 3, DEFAULT_WEEKDAYS),
      lastWorkoutDate: null,
      state: createState(m, today),
    }
    await persist()
  }

  async function saveRecord(record: WorkoutRecord) {
    const id = await addRecord(record)
    records.value = [{ ...record, id }, ...records.value]
  }

  function getNextSlot() {
    if (!progress.value) return null
    const attempted = new Set(
      records.value.filter((r) => r.kind === 'workout').map((r) => r.date),
    )
    const slot = progress.value.schedule.find((s) => !attempted.has(s.date))
    return slot ?? null
  }

  async function updateProgress(data: ActiveProgress) {
    progress.value = data
    await persist()
  }

  async function updateBuiltinScheduleSettings(frequencyDays: 2 | 3, weekdays: Weekday[]) {
    const p = progress.value
    if (!p) return
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
    if (!p || m < 1) return
    const today = todayLocal()
    const stepRef = p.state.stepInCycle
    progress.value = {
      frequencyDays: p.frequencyDays,
      weekdays: p.weekdays,
      schedule: buildBuiltinScheduleSlots(
        today,
        stepRef,
        Math.max(p.schedule.length, 8),
        p.frequencyDays,
        p.weekdays,
      ),
      lastWorkoutDate: p.lastWorkoutDate,
      state: {
        ...p.state,
        anchor: m,
        level: levelFromM(m),
        lastRetestDate: today,
        lastRetestCycleIndex: p.state.cycleIndex,
      },
    }
    await persist()
  }

  async function reduceAnchor() {
    const p = progress.value
    if (!p) return
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
        lastRetestCycleIndex: p.state.cycleIndex,
      },
    }
    await persist()
  }

  function getMissedSlot() {
    if (!progress.value) return null
    const today = todayLocal()
    const attempted = new Set(
      records.value.filter((r) => r.kind === 'workout').map((r) => r.date),
    )
    const idx = progress.value.schedule.findIndex((s) => s.date < today && !attempted.has(s.date))
    if (idx < 0) return null
    return { ...progress.value.schedule[idx], index: idx }
  }

  return {
    progress,
    records,
    hydrate,
    initFromTest,
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
