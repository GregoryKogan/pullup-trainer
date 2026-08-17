<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SetCardsRow from '@/components/workout/SetCardsRow.vue'
import ContourNumber from '@/components/workout/ContourNumber.vue'
import RestTimerRing from '@/components/workout/RestTimerRing.vue'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import IconPullUp from '@/components/icons/pullup/IconPullUp.vue'
import { useWorkoutSessionStore } from '@/stores/workout-session'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { session } from '@/domain/session'
import {
  applyBuiltinLResult,
  computeTotals,
  evaluateWorkout,
} from '@/domain/progression'
import { advanceScheduleAfterWorkout, findScheduleSlotIndex } from '@/domain/schedule'
import { useRestTimer } from '@/composables/use-rest-timer'
import { requestNotificationPermission, signalRestEnd } from '@/composables/use-rest-signals'
import { todayLocal, toIsoOffset, formatTime } from '@/utils/dates'
import {
  clampRestSeconds,
  focusSubtitleKey,
  setTypeLabelKey,
} from '@/utils/workout-display'
import { REST_MAX_SECONDS } from '@/constants/app'
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
const maxDoneInput = ref(0)
const elapsed = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | null = null
const startedAt = ref(new Date())

const restDuration = computed(() => {
  const base = settingsStore.settings?.restDurationSeconds ?? 180
  return clampRestSeconds(base)
})

const restMin = 0
const restMax = REST_MAX_SECONDS

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

const setProgressLabel = computed(() =>
  t('workout.setOf', { current: current.value + 1, total: planned.value.length }),
)

const headerA11yLabel = computed(() => {
  const p = progressStore.progress
  const setLabel = setProgressLabel.value
  if (!p) return setLabel
  return `${t('home.stepProgress', { step: p.state.stepInCycle, cycle: p.state.cycleIndex + 1 })} · ${setLabel}`
})

const fewerLabelKey = computed(() => {
  const set = currentSet.value
  if (!set) return 'workout.fewerLabelReps'
  return set.unit === 'seconds' ? 'workout.fewerLabelSeconds' : 'workout.fewerLabelReps'
})

const maxDoneLimit = computed(() => {
  const set = currentSet.value
  if (!set || set.type !== 'max') return 0
  return set.planned + 20
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
  const slot = p.schedule[resolveSlotIndex()]
  const k = slot?.stepRef ?? p.state.stepInCycle
  return session(p.state.anchor, k).sets
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
  const planned = resolvePlanned()
  if (!planned.length) {
    loadFailed.value = true
    return
  }
  workoutStore.start({
    date,
    planned,
    programName: t('common.programName'),
    startedAt: toIsoOffset(new Date()),
  })
}

async function ensureSession() {
  const date = workoutDate()
  if (workoutStore.active && workoutStore.active.date !== date) {
    workoutStore.clear()
  }
  if (!workoutStore.active) await loadSession()
}

onMounted(async () => {
  restTimer.setBounds(restMin, restMax)
  await requestNotificationPermission()
  await ensureSession()
  startedAt.value = new Date()
  elapsedTimer = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startedAt.value.getTime()) / 1000)
  }, 1000)
  window.addEventListener('beforeunload', onBeforeUnload)
})

watch(
  () => route.params.date,
  async () => {
    await ensureSession()
  },
)

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

watch(
  () => [current.value, currentSet.value?.position] as const,
  () => {
    const set = currentSet.value
    if (set?.type === 'max') {
      maxDoneInput.value = set.planned
    }
  },
  { immediate: true },
)

function finishSet(done: number) {
  workoutStore.completeSet(done)
  showFewer.value = false
  if (workoutStore.isComplete()) finishWorkout()
}

async function openFewer() {
  const set = currentSet.value
  fewerValue.value = set?.planned ?? 0
  maxDoneValue.value = set?.type === 'max' ? (set.planned + 20) : (set?.planned ?? 0)
  showFewer.value = true
  await nextTick()
  document.getElementById('fewer-input')?.focus()
}

async function applyRestPreset(seconds: number) {
  const clamped = clampRestSeconds(seconds)
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

  const context = {
    level: p.state.level,
    anchor: p.state.anchor,
    cycleIndex: p.state.cycleIndex,
    stepInCycle: p.state.stepInCycle,
  }
  let nextStep = result === 'success' ? p.state.stepInCycle + 1 : p.state.stepInCycle

  await progressStore.saveRecord({
    date: active.date,
    startedAt: active.startedAt,
    finishedAt: toIsoOffset(now),
    durationSeconds: elapsed.value,
    kind: 'workout',
    program: 'builtin',
    programName: active.programName,
    context,
    result,
    sets: active.completed,
    totals,
  })

  const slotIndex = findScheduleSlotIndex(p.schedule, active.date)
  const newState = applyBuiltinLResult(p.state, active.completed, active.planned)
  const updated: ActiveProgress = {
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

  await progressStore.updateProgress(updated)
  workoutStore.setLastResult({
    result,
    volume: totals.volumeReps,
    planned: plannedTotal,
    done: totals.volumeReps,
    nextStep,
    date: active.date,
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
      <button
        type="button"
        class="iconbtn"
        :aria-label="t('workout.exitLabel')"
        :aria-describedby="'workout-exit-hint'"
        @click="exitWorkout"
      >
        <AppIcon name="x" :size="18" />
      </button>
      <p class="top-progress" aria-hidden="true">{{ setProgressLabel }}</p>
      <span class="sr-only">{{ headerA11yLabel }}</span>
      <time class="clock" aria-hidden="true">{{ formatTime(elapsed) }}</time>
    </div>
    <p id="workout-exit-hint" class="sr-only">{{ t('workout.exitWarn') }}</p>
    <SetCardsRow :sets="setCards" />
    <div class="workout-stage">
      <div
        v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning"
        class="workout-hero"
      >
        <IconPullUp :size="24" class="hero-icon" />
        <p class="kicker">{{ t('workout.doNow') }}</p>
        <p v-if="currentSet.type !== 'reps'" class="type-tag">{{ t(setTypeLabelKey(currentSet.type)) }}</p>
        <ContourNumber
          class="rep"
          :value="currentSet.planned"
          aria-live="polite"
          aria-atomic="true"
        />
        <p class="sub" aria-live="polite">
          {{ t(focusSubtitleKey(currentSet), { n: current + 1, min: currentSet.planned }) }}
        </p>
        <p v-if="currentSet.type === 'max'" class="sub hint">{{ t('workout.maxDoneHint', { min: currentSet.planned }) }}</p>
      </div>
      <RestTimerRing
        v-if="workoutStore.restRunning"
        :remaining="restTimer.remaining.value"
        :total="restTimer.total.value"
        :paused="restTimer.paused.value"
        :min-seconds="restMin"
        :max-seconds="restMax"
        :label="t('workout.rest')"
        @minus="restTimer.adjust(-15)"
        @plus="restTimer.adjust(15)"
        @reset="restTimer.reset()"
        @pause="restTimer.pause()"
        @resume="restTimer.resume()"
        @skip="workoutStore.restRunning = false"
        @preset="applyRestPreset"
      />
      <div
        v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning && !showFewer"
        class="workout-dock"
      >
        <div v-if="currentSet.type === 'max'" class="max-done panel">
          <label class="fewer-label" for="max-done-input">{{ t('workout.maxDoneLabel') }}</label>
          <input
            id="max-done-input"
            v-model.number="maxDoneInput"
            type="number"
            min="0"
            :max="maxDoneLimit"
            :aria-label="t('workout.maxDoneLabel')"
          />
          <button type="button" class="btn accent" @click="finishSet(maxDoneInput)">
            {{ t('workout.doneMax') }}
          </button>
        </div>
        <div v-else class="btnrow">
          <button type="button" class="btn accent" style="flex: 1.6" @click="finishSet(currentSet.planned)">
            {{ t('workout.doneMax') }}
          </button>
          <button type="button" class="btn outline" style="flex: 1" @click="openFewer">{{ t('workout.logDifferent') }}</button>
        </div>
      </div>
      <div v-if="showFewer" class="workout-dock">
        <div class="fewer panel">
          <label class="fewer-label" :for="'fewer-input'">{{ t(fewerLabelKey) }}</label>
          <input
            id="fewer-input"
            v-model.number="fewerValue"
            type="number"
            min="0"
            :max="maxDoneValue"
            :aria-label="t(fewerLabelKey)"
          />
          <div class="btnrow">
            <button type="button" class="btn accent" @click="finishSet(fewerValue)">{{ t('common.confirm') }}</button>
            <button type="button" class="btn outline" @click="showFewer = false">{{ t('common.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
    <ConfirmPanel
      :visible="showExitConfirm"
      :title="t('workout.exitTitle')"
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
.workout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.workout-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.workout-hero {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px 0 16px;
}
.hero-icon {
  margin-bottom: 8px;
  color: var(--accent);
}
.workout-dock {
  flex-shrink: 0;
  padding-top: 4px;
  padding-bottom: max(4px, env(safe-area-inset-bottom, 0px));
}
.workout-dock .btnrow .btn,
.workout-dock .max-done .btn,
.workout-dock .fewer .btnrow .btn {
  margin-top: 0;
}
.workout-dock .max-done,
.workout-dock .fewer {
  margin-bottom: 0;
}
.top {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 14px;
}
.top-progress {
  flex: 1;
  min-width: 0;
  margin: 0;
  text-align: center;
  padding: 0 8px;
  font: 800 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
}
.clock {
  font: 800 0.8rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.workout-hero .kicker {
  margin-bottom: 14px;
}
.workout-hero .sub {
  margin-top: 10px;
  font: 800 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.type-tag {
  font: 800 0.65rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--accent2);
  margin: 0 0 8px;
}
.rep {
  line-height: 1;
}
.fewer input,
.max-done input {
  width: 100%;
  min-height: 50px;
  font-size: 1.5rem;
  border: 2px solid var(--line);
  padding: 8px 12px;
  background: var(--bg);
  color: var(--ink);
  margin-bottom: 12px;
}
.max-done {
  margin-bottom: 0;
}
.hint {
  margin: 8px 0 0;
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
