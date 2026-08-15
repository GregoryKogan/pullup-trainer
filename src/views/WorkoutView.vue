<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SetCardsRow from '@/components/workout/SetCardsRow.vue'
import RestTimerRing from '@/components/workout/RestTimerRing.vue'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import { useWorkoutSessionStore } from '@/stores/workout-session'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { session } from '@/domain/session'
import { path0Session } from '@/domain/path0'
import {
  applyBuiltinLResult,
  applyPath0Result,
  applyCustomResult,
  computeTotals,
  evaluateWorkout,
} from '@/domain/progression'
import { advanceScheduleAfterWorkout, findScheduleSlotIndex } from '@/domain/schedule'
import { useRestTimer } from '@/composables/use-rest-timer'
import { requestNotificationPermission, signalRestEnd } from '@/composables/use-rest-signals'
import { getCustomProgram } from '@/db/repositories/custom-programs'
import { todayLocal, toIsoOffset, formatTime } from '@/utils/dates'
import {
  clampRestSeconds,
  doneButtonKey,
  focusSubtitleKey,
  setTypeLabelKey,
} from '@/utils/workout-display'
import type { PlannedSet, ActiveProgress } from '@/domain/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const workoutStore = useWorkoutSessionStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const showFewer = ref(false)
const showExitConfirm = ref(false)
const loadFailed = ref(false)
const fewerValue = ref(0)
const maxDoneValue = ref(0)
const elapsed = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | null = null
const startedAt = ref(new Date())

const isPathP0 = computed(
  () => progressStore.progress?.source === 'builtin' && progressStore.progress.state.path === 'P0',
)

const restDuration = computed(() => {
  const base = settingsStore.settings?.restDurationSeconds ?? 180
  return clampRestSeconds(base, isPathP0.value)
})

const restTimer = useRestTimer(async () => {
  const s = settingsStore.settings
  await signalRestEnd(
    s?.restVibrate ?? true,
    s?.restNotify ?? true,
    t('workout.restCompleteTitle'),
    t('workout.restCompleteBody'),
  )
  workoutStore.restRunning = false
})

const planned = computed(() => workoutStore.active?.planned ?? [])
const current = computed(() => workoutStore.active?.currentIndex ?? 0)
const currentSet = computed(() => planned.value[current.value])

const stepLabel = computed(() => {
  const p = progressStore.progress
  if (!p) return ''
  if (p.source === 'builtin' && p.state.path === 'L') {
    return `${t('home.stepProgress', { step: p.state.stepInCycle, cycle: p.state.cycleIndex + 1 })} · `
  }
  if (p.source === 'builtin' && p.state.path === 'P0') {
    return `${t('home.path0Step', { step: p.state.path0Step })} · `
  }
  return ''
})

const setCards = computed(() =>
  planned.value.map((p, i) => ({
    planned: p.planned,
    type: p.type,
    unit: p.unit,
    done: workoutStore.active?.completed.find((c) => c.position === p.position)?.done,
    current: i === current.value && !workoutStore.isComplete(),
    doneFlag: !!workoutStore.active?.completed.find((c) => c.position === p.position),
  })),
)

function resolveSlotIndex(): number {
  const p = progressStore.progress
  if (!p) return 0
  return findScheduleSlotIndex(p.schedule, workoutDate())
}

function resolvePlanned(): PlannedSet[] {
  const p = progressStore.progress
  if (!p) return []
  if (p.source === 'custom') return []
  const slot = p.schedule[resolveSlotIndex()]
  if (p.state.path === 'P0') {
    const step = slot?.stepRef ?? p.state.path0Step
    return path0Session(step).sets
  }
  const k = slot?.stepRef ?? (p.state.path === 'L' ? p.state.stepInCycle : 1)
  if (p.state.path === 'L') return session(p.state.anchor, k).sets
  return []
}

function workoutDate(): string {
  const param = route.params.date
  if (typeof param === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(param)) return param
  return todayLocal()
}

async function loadSession() {
  loadFailed.value = false
  const p = progressStore.progress
  if (!p) {
    loadFailed.value = true
    return
  }
  const date = workoutDate()
  if (p.source === 'custom') {
    const program = await getCustomProgram(p.customProgramId)
    const step = program?.steps[p.currentStepIndex]
    if (!step) {
      loadFailed.value = true
      return
    }
    workoutStore.start({
      date,
      planned: step.sets,
      programName: program?.name ?? t('programs.customFallback'),
      program: 'custom',
      startedAt: toIsoOffset(new Date()),
    })
    return
  }
  const planned = resolvePlanned()
  if (!planned.length) {
    loadFailed.value = true
    return
  }
  workoutStore.start({
    date,
    planned,
    programName: t('common.programName'),
    program: 'builtin',
    startedAt: toIsoOffset(new Date()),
  })
}

onMounted(async () => {
  await requestNotificationPermission()
  if (!workoutStore.active) await loadSession()
  startedAt.value = new Date()
  elapsedTimer = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startedAt.value.getTime()) / 1000)
  }, 1000)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  if (elapsedTimer) clearInterval(elapsedTimer)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (workoutStore.active && !workoutStore.isComplete()) e.preventDefault()
}

watch(
  () => workoutStore.restRunning,
  (running) => {
    if (running && settingsStore.settings?.restAutoStart) {
      restTimer.start(restDuration.value)
    }
  },
)

function finishSet(done: number) {
  workoutStore.completeSet(done)
  showFewer.value = false
  if (workoutStore.isComplete()) finishWorkout()
}

function openFewer() {
  const set = currentSet.value
  fewerValue.value = set?.planned ?? 0
  maxDoneValue.value = set?.type === 'max' ? (set.planned + 20) : (set?.planned ?? 0)
  showFewer.value = true
}

function finishMaxSet() {
  openFewer()
  fewerValue.value = maxDoneValue.value || currentSet.value?.planned || 0
}

async function applyRestPreset(seconds: number) {
  const clamped = clampRestSeconds(seconds, isPathP0.value)
  await settingsStore.update({ restDurationSeconds: clamped })
  restTimer.start(clamped)
  workoutStore.restRunning = true
}

async function finishWorkout() {
  const active = workoutStore.active
  const p = progressStore.progress
  if (!active || !p) return

  const result = evaluateWorkout(active.completed, active.planned)
  const totals = computeTotals(active.completed)
  const plannedTotal = active.planned.reduce(
    (s, set) => s + (set.unit === 'reps' ? set.planned : 0),
    0,
  )
  const now = new Date()

  let context
  let nextStep: number | undefined
  if (p.source === 'builtin' && p.state.path === 'L') {
    context = {
      level: p.state.level,
      anchor: p.state.anchor,
      cycleIndex: p.state.cycleIndex,
      stepInCycle: p.state.stepInCycle,
    }
    nextStep = result === 'success' ? p.state.stepInCycle + 1 : p.state.stepInCycle
  } else if (p.source === 'builtin' && p.state.path === 'P0') {
    context = { level: 'P0' as const, path0Step: p.state.path0Step }
    nextStep = result === 'success' ? p.state.path0Step + 1 : p.state.path0Step
  }

  await progressStore.saveRecord({
    date: active.date,
    startedAt: active.startedAt,
    finishedAt: toIsoOffset(now),
    durationSeconds: elapsed.value,
    kind: 'workout',
    program: active.program,
    programName: active.programName,
    context,
    result,
    sets: active.completed,
    totals,
  })

  const slotIndex = findScheduleSlotIndex(p.schedule, active.date)
  let updated: ActiveProgress = { ...p }
  if (p.source === 'builtin') {
    if (p.state.path === 'L') {
      const newState = applyBuiltinLResult(p.state, active.completed, active.planned)
      updated = {
        ...p,
        state: newState,
        lastWorkoutDate: active.date,
        schedule: advanceScheduleAfterWorkout(
          p.schedule,
          slotIndex,
          result === 'success',
          newState.stepInCycle,
          p.frequencyDays,
          p.weekdays,
        ),
      }
      nextStep = newState.stepInCycle
    } else {
      const newState = applyPath0Result(p.state, active.completed, active.planned)
      updated = {
        ...p,
        state: newState,
        lastWorkoutDate: active.date,
        schedule: advanceScheduleAfterWorkout(
          p.schedule,
          slotIndex,
          result === 'success',
          newState.path0Step,
          p.frequencyDays,
          p.weekdays,
        ),
      }
      nextStep = newState.path0Step
    }
  } else if (p.source === 'custom') {
    const program = await getCustomProgram(p.customProgramId)
    const totalSteps = program?.steps.length ?? 1
    const customState = applyCustomResult(p, active.completed, active.planned, totalSteps)
    updated = {
      ...p,
      ...customState,
      lastWorkoutDate: active.date,
      schedule: advanceScheduleAfterWorkout(
        p.schedule,
        slotIndex,
        result === 'success',
        p.currentStepIndex,
        3,
        ['mon', 'wed', 'fri'],
      ),
    }
  }

  await progressStore.updateProgress(updated)
  workoutStore.setLastResult({
    result,
    volume: totals.volumeReps,
    planned: plannedTotal,
    done: totals.volumeReps,
    nextStep,
  })
  workoutStore.clear()
  router.push({ name: 'result' })
}

function exitWorkout() {
  showExitConfirm.value = true
}

function confirmExit() {
  showExitConfirm.value = false
  finishWorkout()
}
</script>

<template>
  <div v-if="workoutStore.active" class="workout">
    <h1 class="sr-only">{{ t('common.programName') }}</h1>
    <div class="top">
      <button type="button" class="iconbtn" :aria-label="t('common.close')" @click="exitWorkout">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" />
        </svg>
      </button>
      <span class="step">
        {{ stepLabel }}{{ t('workout.setOf', { current: current + 1, total: planned.length }) }}
      </span>
      <span class="clock">{{ formatTime(elapsed) }}</span>
    </div>
    <SetCardsRow :sets="setCards" />
    <div v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning" class="focus">
      <p class="kicker">{{ t('workout.doNow') }}</p>
      <p v-if="currentSet.type !== 'reps'" class="type-tag">{{ t(setTypeLabelKey(currentSet.type)) }}</p>
      <div class="rep" aria-live="polite" aria-atomic="true">{{ currentSet.planned }}</div>
      <p class="sub" aria-live="polite">
        {{ t(focusSubtitleKey(currentSet), { n: current + 1, min: currentSet.planned }) }}
      </p>
    </div>
    <RestTimerRing
      v-if="workoutStore.restRunning"
      :remaining="restTimer.remaining.value"
      :total="restTimer.total.value"
      :paused="restTimer.paused.value"
      :label="t('workout.rest')"
      @minus="restTimer.adjust(-15)"
      @plus="restTimer.adjust(15)"
      @pause="restTimer.togglePause()"
      @reset="restTimer.reset()"
      @skip="workoutStore.restRunning = false"
      @preset="applyRestPreset"
    />
    <div v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning" class="btnrow">
      <button
        v-if="currentSet.type === 'max'"
        type="button"
        class="btn accent"
        style="flex: 1.6"
        @click="finishMaxSet"
      >
        {{ t('workout.doneMax') }}
      </button>
      <button
        v-else
        type="button"
        class="btn accent"
        style="flex: 1.6"
        @click="finishSet(currentSet.planned)"
      >
        {{ t(doneButtonKey(currentSet), { n: currentSet.planned }) }}
      </button>
      <button type="button" class="btn ghost" style="flex: 1" @click="openFewer">{{ t('workout.logFewer') }}</button>
    </div>
    <div v-if="showFewer" class="fewer panel">
      <label class="fewer-label" :for="'fewer-input'">{{ t('workout.fewerLabel') }}</label>
      <input
        id="fewer-input"
        v-model.number="fewerValue"
        type="number"
        min="0"
        :max="maxDoneValue"
        :aria-label="t('workout.fewerLabel')"
      />
      <div class="btnrow">
        <button type="button" class="btn accent" @click="finishSet(fewerValue)">{{ t('common.confirm') }}</button>
        <button type="button" class="btn ghost" @click="showFewer = false">{{ t('common.cancel') }}</button>
      </div>
    </div>
    <ConfirmPanel
      :visible="showExitConfirm"
      :message="t('workout.exitWarn')"
      @confirm="confirmExit"
      @cancel="showExitConfirm = false"
    />
  </div>
  <div v-else-if="loadFailed" class="panel load-error">
    <p class="sub">{{ t('workout.loadError') }}</p>
    <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
  </div>
</template>

<style scoped>
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 14px;
}
.step {
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.clock {
  font: 800 0.8rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.focus {
  background: var(--card);
  border: 2px solid var(--line);
  border-radius: 2px;
  box-shadow: 5px 5px 0 var(--shadow);
  text-align: center;
  padding: 18px 12px 14px;
  margin-bottom: 14px;
}
.type-tag {
  font: 800 0.65rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--accent2);
  margin: 0 0 8px;
}
.rep {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 7.4rem;
  font-weight: 900;
  line-height: 1;
  color: var(--accent);
}
@supports (-webkit-text-stroke: 2.5px var(--accent)) {
  .rep {
    color: transparent;
    -webkit-text-stroke: 2.5px var(--accent);
  }
}
.fewer input {
  width: 100%;
  min-height: 50px;
  font-size: 1.5rem;
  border: 2px solid var(--line);
  padding: 8px 12px;
  background: var(--bg);
  color: var(--ink);
  margin-bottom: 12px;
}
.fewer-label {
  display: block;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  margin-bottom: 8px;
}
.load-error {
  margin-top: 24px;
  text-align: center;
}
</style>
