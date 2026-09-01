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
import { advanceScheduleAfterWorkout, findScheduleSlotIndex, hasWorkoutRecord } from '@/domain/schedule'
import { useRestTimer } from '@/composables/use-rest-timer'
import { requestNotificationPermission, signalRestEnd, unlockRestSound } from '@/composables/use-rest-signals'
import { todayLocal, toIsoOffset, formatTime } from '@/utils/dates'
import {
  clampRestSeconds,
} from '@/utils/workout-display'
import { blockRepFractionKey, clampRepCount, REP_COUNT_MAX, syncRepInput } from '@/utils/reps-input'
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

const maxDoneLimit = computed(() => {
  const set = currentSet.value
  if (!set || set.type !== 'max') return 0
  return REP_COUNT_MAX
})

const fewerAtMin = computed(() => fewerValue.value <= 0)
const fewerAtMax = computed(() => fewerValue.value >= maxDoneValue.value)
const maxDoneAtMin = computed(() => maxDoneInput.value <= 0)
const maxDoneAtMax = computed(() => maxDoneInput.value >= maxDoneLimit.value)

const setCards = computed(() =>
  planned.value.map((p, i) => ({
    planned: p.planned,
    done: workoutStore.active?.completed.find((c) => c.position === p.position)?.done,
    isMax: p.type === 'max',
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
  const nextSlot = progressStore.getNextSlot()
  if (!nextSlot || nextSlot.date !== date) {
    loadFailed.value = true
    return
  }
  if (hasWorkoutRecord(progressStore.records, date)) {
    loadFailed.value = true
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
  if (settingsStore.settings?.restNotify ?? true) {
    await requestNotificationPermission()
  }
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
    if (!running) return
    restTimer.start(settingsStore.settings?.restAutoStart ? restDuration.value : 0)
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
  void unlockRestSound()
  workoutStore.completeSet(done)
  showFewer.value = false
  if (workoutStore.isComplete()) finishWorkout()
}

async function openFewer() {
  const set = currentSet.value
  fewerValue.value = set?.planned ?? 0
  maxDoneValue.value = (set?.planned ?? 0) + 20
  showFewer.value = true
  await nextTick()
  document.getElementById('fewer-input')?.focus()
}

function adjustFewer(delta: number) {
  fewerValue.value = clampRepCount(fewerValue.value + delta, maxDoneValue.value, 0)
}

function adjustMaxDone(delta: number) {
  maxDoneInput.value = clampRepCount(maxDoneInput.value + delta, maxDoneLimit.value, 0)
}

function onFewerInput(event: Event) {
  syncRepInput(event, (value) => { fewerValue.value = value }, maxDoneValue.value, 0)
}

function onMaxDoneInput(event: Event) {
  syncRepInput(event, (value) => { maxDoneInput.value = value }, maxDoneLimit.value, 0)
}

function skipRest() {
  restTimer.skip()
  workoutStore.restRunning = false
}

async function applyRestPreset(seconds: number) {
  void unlockRestSound()
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
  const plannedTotal = active.planned.reduce((s, set) => s + set.planned, 0)
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
      <span class="clock" aria-hidden="true">{{ formatTime(elapsed) }}</span>
    </div>
    <p id="workout-exit-hint" class="sr-only">{{ t('workout.exitWarn') }}</p>
    <SetCardsRow :sets="setCards" />
    <div class="workout-stage">
      <div
        v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning"
        class="workout-hero"
      >
        <IconPullUp :size="30" class="hero-icon" />
        <template v-if="currentSet.type === 'max'">
          <p class="kicker">{{ t('workout.maxSetKicker') }}</p>
          <p class="sub max-instruction">{{ t('workout.maxSetInstruction') }}</p>
          <p class="min-label">{{ t('workout.maxSetMinLabel') }}</p>
          <ContourNumber
            :key="`max-${current}`"
            class="rep"
            :value="currentSet.planned"
            aria-live="polite"
            aria-atomic="true"
          />
          <span class="sr-only">
            {{ t('workout.maxSetA11y', { min: currentSet.planned, n: current + 1 }) }}
          </span>
        </template>
        <template v-else>
          <p class="kicker">{{ t('workout.doNow') }}</p>
          <ContourNumber
            :key="`work-${current}`"
            class="rep"
            :value="currentSet.planned"
            aria-live="polite"
            aria-atomic="true"
          />
          <p class="sub" aria-live="polite">{{ t('workout.focusReps') }}</p>
        </template>
      </div>
      <RestTimerRing
        v-if="workoutStore.restRunning"
        :remaining="restTimer.remaining.value"
        :total="restTimer.total.value"
        :paused="restTimer.paused.value"
        :min-seconds="restMin"
        :max-seconds="restMax"
        :default-seconds="restDuration"
        :label="t('workout.rest')"
        @minus="restTimer.adjust(-15)"
        @plus="restTimer.adjust(15)"
        @reset="restTimer.reset()"
        @pause="restTimer.pause()"
        @resume="restTimer.resume()"
        @skip="skipRest"
        @preset="applyRestPreset"
      />
      <div
        v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning && !showFewer"
        class="workout-dock"
      >
        <div v-if="currentSet.type === 'max'" class="max-done panel">
          <label class="fewer-label" for="max-done-input">{{ t('workout.maxDoneLabel') }}</label>
          <div class="rep-stepper">
            <button
              type="button"
              class="iconbtn rep-step"
              :class="{ inactive: maxDoneAtMin }"
              :aria-label="t('onboarding.repsDecrease')"
              :disabled="maxDoneAtMin"
              @click="adjustMaxDone(-1)"
            >
              <AppIcon name="minus" />
            </button>
            <input
              id="max-done-input"
              v-model.number="maxDoneInput"
              type="number"
              min="0"
              :max="maxDoneLimit"
              step="1"
              inputmode="numeric"
              :aria-label="t('workout.maxDoneLabel')"
              @keydown="blockRepFractionKey"
              @input="onMaxDoneInput"
            />
            <button
              type="button"
              class="iconbtn rep-step"
              :class="{ inactive: maxDoneAtMax }"
              :aria-label="t('onboarding.repsIncrease')"
              :disabled="maxDoneAtMax"
              @click="adjustMaxDone(1)"
            >
              <AppIcon name="plus" />
            </button>
          </div>
          <button type="button" class="btn accent" @click="finishSet(maxDoneInput)">
            {{ t('workout.doneMax') }}
          </button>
        </div>
        <div v-else class="btnrow">
          <button type="button" class="btn accent set-actions-primary" @click="finishSet(currentSet.planned)">
            {{ t('workout.doneMax') }}
          </button>
          <button type="button" class="btn outline set-actions-secondary" @click="openFewer">
            {{ t('workout.logDifferent') }}
          </button>
        </div>
      </div>
      <div v-if="showFewer" class="workout-dock">
        <div class="fewer panel">
          <label class="fewer-label" :for="'fewer-input'">{{ t('workout.fewerLabelReps') }}</label>
          <div class="rep-stepper">
            <button
              type="button"
              class="iconbtn rep-step"
              :class="{ inactive: fewerAtMin }"
              :aria-label="t('onboarding.repsDecrease')"
              :disabled="fewerAtMin"
              @click="adjustFewer(-1)"
            >
              <AppIcon name="minus" />
            </button>
            <input
              id="fewer-input"
              v-model.number="fewerValue"
              type="number"
              min="0"
              :max="maxDoneValue"
              step="1"
              inputmode="numeric"
              :aria-label="t('workout.fewerLabelReps')"
              @keydown="blockRepFractionKey"
              @input="onFewerInput"
            />
            <button
              type="button"
              class="iconbtn rep-step"
              :class="{ inactive: fewerAtMax }"
              :aria-label="t('onboarding.repsIncrease')"
              :disabled="fewerAtMax"
              @click="adjustFewer(1)"
            >
              <AppIcon name="plus" />
            </button>
          </div>
          <div class="btnrow">
            <button type="button" class="btn accent" @click="finishSet(fewerValue)">{{ t('common.confirm') }}</button>
            <button type="button" class="btn outline" @click="showFewer = false">{{ t('common.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
    <ConfirmPanel
      :visible="showExitConfirm"
      destructive
      :title="t('workout.exitTitle')"
      :message="t('workout.exitWarn')"
      @confirm="confirmExit"
      @cancel="showExitConfirm = false"
    />
  </div>
  <div v-else-if="loadFailed" class="load-error-page">
    <div class="panel load-error">
      <p class="sub">{{ t('workout.loadError') }}</p>
      <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
    </div>
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
  color: var(--accent-text);
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
.max-instruction {
  margin: 0 0 28px;
  max-width: 20em;
  letter-spacing: 0.08em;
  text-wrap: balance;
}
.min-label {
  margin: 0 0 2px;
  font: 800 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.rep {
  line-height: 1;
  margin: 2px 0 10px;
}
.rep-stepper {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 12px;
}
.rep-stepper input {
  flex: 1;
  min-width: 0;
  min-height: 50px;
  font: 800 1.5rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  border: 2px solid var(--line);
  padding: 8px 12px;
  background: var(--bg);
  color: var(--ink);
  text-align: center;
}
.rep-step {
  flex: 0 0 50px;
  width: 50px;
  min-height: 50px;
  font: 800 1.5rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.max-done {
  margin-bottom: 0;
}
.set-actions-primary {
  flex: 1.5;
}
.set-actions-secondary {
  flex: 1;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}
.fewer-label {
  display: block;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  margin-bottom: 8px;
}
/* Landscape phones: the stage cannot fit at full scale, so tighten every
   gap and let the column grow past the viewport instead of clipping. */
@media (max-height: 520px) {
  .workout {
    flex: 1 0 auto;
  }
  .workout-stage {
    flex: 0 0 auto;
  }
  .top {
    padding: 2px 0 8px;
  }
  .workout-hero {
    flex: 0 0 auto;
    padding: 0 0 10px;
  }
  .hero-icon {
    display: none;
  }
  .workout-hero .kicker {
    margin-bottom: 8px;
  }
  .workout-hero .sub {
    margin-top: 4px;
  }
  .rep {
    margin: 0 0 4px;
  }
  .max-instruction {
    display: none;
  }
  .min-label {
    margin: 0;
  }
  .rep-stepper {
    margin-bottom: 8px;
  }
  .rep-stepper input,
  .rep-step {
    min-height: 46px;
  }
  .fewer-label {
    margin-bottom: 6px;
  }
  .workout-dock .panel {
    padding: 10px;
  }
  .workout-dock .btn {
    min-height: 46px;
  }
}

/* Landscape has width to spare: put the hero beside the dock so the whole
   stage fits without scrolling. */
@media (max-height: 520px) and (min-width: 560px) {
  .workout-stage {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .workout-hero {
    flex: 1 1 0;
    min-width: 0;
    padding: 0;
  }
  .workout-dock {
    flex: 1 1 0;
    min-width: 0;
    padding-top: 0;
  }
  .max-instruction {
    display: block;
    margin: 0 0 10px;
  }
}
.load-error-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.load-error {
  text-align: center;
}
</style>
