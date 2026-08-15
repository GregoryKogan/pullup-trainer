<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SetCardsRow from '@/components/workout/SetCardsRow.vue'
import RestTimerRing from '@/components/workout/RestTimerRing.vue'
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
import { advanceScheduleAfterWorkout } from '@/domain/schedule'
import { useRestTimer } from '@/composables/use-rest-timer'
import { requestNotificationPermission, signalRestEnd } from '@/composables/use-rest-signals'
import { getCustomProgram } from '@/db/repositories/custom-programs'
import { todayLocal, toIsoOffset, formatTime } from '@/utils/dates'
import type { PlannedSet, ActiveProgress } from '@/domain/types'

const router = useRouter()
const { t } = useI18n()
const workoutStore = useWorkoutSessionStore()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const showFewer = ref(false)
const fewerValue = ref(0)
const elapsed = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | null = null
const startedAt = ref(new Date())

const restTimer = useRestTimer(async () => {
  const s = settingsStore.settings
  await signalRestEnd(s?.restVibrate ?? true, s?.restNotify ?? true)
  workoutStore.restRunning = false
})

const planned = computed(() => workoutStore.active?.planned ?? [])
const current = computed(() => workoutStore.active?.currentIndex ?? 0)
const currentSet = computed(() => planned.value[current.value])

const setCards = computed(() =>
  planned.value.map((p, i) => ({
    planned: p.planned,
    done: workoutStore.active?.completed.find((c) => c.position === p.position)?.done,
    current: i === current.value && !workoutStore.isComplete(),
    doneFlag: !!workoutStore.active?.completed.find((c) => c.position === p.position),
  })),
)

function resolvePlanned(): PlannedSet[] {
  const p = progressStore.progress
  if (!p) return []
  if (p.source === 'custom') {
    return []
  }
  const slot = p.schedule[0]
  if (p.state.path === 'P0') return path0Session(p.state.path0Step).sets
  const k = slot?.stepRef ?? (p.state.path === 'L' ? p.state.stepInCycle : 1)
  if (p.state.path === 'L') return session(p.state.anchor, k).sets
  return []
}

async function loadSession() {
  const p = progressStore.progress
  if (!p) return
  if (p.source === 'custom') {
    const program = await getCustomProgram(p.customProgramId)
    const step = program?.steps[p.currentStepIndex]
    if (!step) return
    workoutStore.start({
      date: todayLocal(),
      planned: step.sets,
      programName: program?.name ?? 'Custom',
      program: 'custom',
      startedAt: toIsoOffset(new Date()),
    })
    return
  }
  const sets = resolvePlanned()
  workoutStore.start({
    date: todayLocal(),
    planned: sets,
    programName: 'Pull-up Trainer',
    program: 'builtin',
    startedAt: toIsoOffset(new Date()),
  })
}

onMounted(async () => {
  await requestNotificationPermission()
  if (!workoutStore.active) {
    await loadSession()
  }
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
  if (workoutStore.active && !workoutStore.isComplete()) {
    e.preventDefault()
  }
}

watch(
  () => workoutStore.restRunning,
  (running) => {
    if (running && settingsStore.settings?.restAutoStart) {
      restTimer.start(settingsStore.settings.restDurationSeconds)
    }
  },
)

function finishSet(done: number) {
  workoutStore.completeSet(done)
  showFewer.value = false
  if (workoutStore.isComplete()) finishWorkout()
}

function openFewer() {
  fewerValue.value = currentSet.value?.planned ?? 0
  showFewer.value = true
}

async function finishWorkout() {
  const active = workoutStore.active
  const p = progressStore.progress
  if (!active || !p) return

  const result = evaluateWorkout(active.completed, active.planned)
  const totals = computeTotals(active.completed)
  const now = new Date()

  let context
  if (p.source === 'builtin' && p.state.path === 'L') {
    context = {
      level: p.state.level,
      anchor: p.state.anchor,
      cycleIndex: p.state.cycleIndex,
      stepInCycle: p.state.stepInCycle,
    }
  } else if (p.source === 'builtin' && p.state.path === 'P0') {
    context = { level: 'P0' as const, path0Step: p.state.path0Step }
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
          0,
          result === 'success',
          newState.stepInCycle,
          p.frequencyDays,
          p.weekdays,
        ),
      }
    } else {
      const newState = applyPath0Result(p.state, active.completed, active.planned)
      updated = {
        ...p,
        state: newState,
        lastWorkoutDate: active.date,
        schedule: advanceScheduleAfterWorkout(
          p.schedule,
          0,
          result === 'success',
          newState.path0Step,
          p.frequencyDays,
          p.weekdays,
        ),
      }
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
        0,
        result === 'success',
        p.currentStepIndex,
        3,
        ['mon', 'wed', 'fri'],
      ),
    }
  }

  await progressStore.updateProgress(updated)
  workoutStore.clear()
  router.push({ name: 'result', query: { result } })
}

function exitWorkout() {
  if (confirm(t('workout.exitWarn'))) {
    finishWorkout()
  }
}
</script>

<template>
  <div v-if="workoutStore.active" class="workout">
    <div class="top">
      <button type="button" class="iconbtn" aria-label="Close" @click="exitWorkout">×</button>
      <span class="step">{{ t('workout.setOf', { current: current + 1, total: planned.length }) }}</span>
      <span class="clock">{{ formatTime(elapsed) }}</span>
    </div>
    <SetCardsRow :sets="setCards" />
    <div v-if="currentSet && !workoutStore.isComplete()" class="focus">
      <p class="kicker">{{ t('workout.nextUp') }}</p>
      <div class="rep">{{ currentSet.planned }}</div>
      <p class="sub">
        {{ currentSet.unit === 'seconds' ? t('workout.seconds') : t('workout.reps') }}
      </p>
    </div>
    <RestTimerRing
      v-if="workoutStore.restRunning"
      :remaining="restTimer.remaining.value"
      :total="restTimer.total.value"
      :label="t('workout.rest')"
      @minus="restTimer.adjust(-15)"
      @plus="restTimer.adjust(15)"
      @pause="restTimer.togglePause()"
      @reset="restTimer.reset()"
      @skip="workoutStore.restRunning = false"
    />
    <div v-if="currentSet && !workoutStore.isComplete() && !workoutStore.restRunning" class="btnrow">
      <button type="button" class="btn accent" style="flex: 1.6" @click="finishSet(currentSet.planned)">
        {{ t('workout.doneReps', { n: currentSet.planned }) }}
      </button>
      <button type="button" class="btn ghost" style="flex: 1" @click="openFewer">{{ t('workout.logFewer') }}</button>
    </div>
    <div v-if="showFewer" class="fewer panel">
      <input v-model.number="fewerValue" type="number" min="0" :max="currentSet?.planned" />
      <button type="button" class="btn accent" @click="finishSet(fewerValue)">{{ t('common.confirm') }}</button>
    </div>
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
.rep {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 7.2rem;
  font-weight: 900;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2.5px var(--accent);
}
.fewer input {
  width: 100%;
  min-height: 44px;
  margin-bottom: 8px;
  font-size: 1.2rem;
}
</style>
