<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWorkoutSessionStore } from '@/stores/workout-session'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const workoutStore = useWorkoutSessionStore()

function parseNum(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const summary = computed(() => workoutStore.lastResult)

const success = computed(() => {
  if (summary.value) return summary.value.result === 'success'
  return route.query.result === 'success'
})

const volume = computed(() => summary.value?.volume ?? parseNum(route.query.volume))
const planned = computed(() => summary.value?.planned ?? parseNum(route.query.planned))
const done = computed(() => summary.value?.done ?? parseNum(route.query.done))
const nextStep = computed(() => {
  if (summary.value?.nextStep !== undefined) return String(summary.value.nextStep)
  return route.query.next
})

const retryDate = computed(() => summary.value?.date ?? (typeof route.query.date === 'string' ? route.query.date : null))

function retryWorkout() {
  if (retryDate.value) router.push(`/workout/${retryDate.value}`)
  else router.push('/workout')
}

const statusRef = ref<HTMLElement | null>(null)

onMounted(() => {
  statusRef.value?.focus()
})
</script>

<template>
  <div class="page result-page">
    <div class="result panel" :class="success ? 'ok' : 'fail'" role="status" aria-live="polite" aria-atomic="true">
      <h1 class="sr-only">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</h1>
      <div class="icon" aria-hidden="true">
        <svg v-if="success" width="48" height="48" viewBox="0 0 24 24">
          <path d="M4 12.5 9.5 18 20 6" fill="none" stroke="currentColor" stroke-width="2.5" />
        </svg>
        <svg v-else width="48" height="48" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" />
        </svg>
      </div>
      <p ref="statusRef" tabindex="-1" class="kicker status-kicker">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</p>
      <p v-if="planned > 0" class="summary">{{ t('workout.resultVolume', { done, planned }) }}</p>
      <p v-else-if="volume > 0" class="summary">{{ t('workout.volume', { n: volume }) }}</p>
      <p v-if="success && nextStep" class="sub">{{ t('workout.resultNext', { step: nextStep }) }}</p>
      <p v-else-if="!success" class="sub">{{ t('workout.resultRetry') }}</p>
      <div class="btnrow">
        <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
        <button v-if="!success && retryDate" type="button" class="btn accent" @click="retryWorkout">
          {{ t('result.tryAgain') }}
        </button>
        <button v-if="!success" type="button" class="btn ghost" @click="router.push('/calendar')">
          {{ t('nav.calendar') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-page {
  justify-content: center;
}
.result {
  margin-top: 0;
  text-align: center;
}
.result.ok {
  border-color: var(--ok);
}
.result.fail {
  border-color: var(--bad);
}
.icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  color: var(--ok);
}
.icon svg {
  width: 64px;
  height: 64px;
}
.result.fail .icon {
  color: var(--bad);
}
.status-kicker {
  margin-bottom: 12px;
  outline: none;
}
.summary {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.7rem;
  text-transform: uppercase;
  margin: 12px 0;
}
.btnrow {
  justify-content: center;
}
</style>
