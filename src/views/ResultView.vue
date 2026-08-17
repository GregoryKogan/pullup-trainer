<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWorkoutSessionStore } from '@/stores/workout-session'
import { useProgressStore } from '@/stores/progress'
import { formatDisplayDate } from '@/utils/dates'
import AppIcon from '@/components/icons/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const workoutStore = useWorkoutSessionStore()
const progressStore = useProgressStore()

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

const nextSlotDate = computed(() => progressStore.getNextSlot()?.date ?? null)

const statusRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const hasStore = !!summary.value
  const hasQuery = route.query.result !== undefined
  if (!hasStore && !hasQuery) {
    router.replace({ name: 'home' })
    return
  }
  statusRef.value?.focus()
})
</script>

<template>
  <div class="page result-page">
    <div class="result panel" :class="success ? 'ok' : 'fail'" role="status" aria-live="polite" aria-atomic="true">
      <h1 class="sr-only">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</h1>
      <div class="icon" aria-hidden="true">
        <AppIcon v-if="success" name="check" :size="64" />
        <AppIcon v-else name="x" :size="64" />
      </div>
      <p ref="statusRef" tabindex="-1" class="kicker status-kicker">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</p>
      <p v-if="planned > 0" class="summary">{{ t('workout.resultVolume', { done, planned }) }}</p>
      <p v-else-if="volume > 0" class="summary">{{ t('workout.volume', { n: volume }) }}</p>
      <p v-if="success && nextStep" class="sub">{{ t('workout.resultNext', { step: nextStep }) }}</p>
      <p v-else-if="!success" class="sub">{{ t('workout.resultRetry') }}</p>
      <p v-if="!success && nextSlotDate" class="sub next-date">
        {{ t('workout.resultNextDate', { date: formatDisplayDate(nextSlotDate, locale) }) }}
      </p>
      <div class="btnrow">
        <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
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
.result .sub {
  margin: 0 0 16px;
  font: 800 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.next-date {
  margin-top: -8px;
}
.btnrow {
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  margin-top: 4px;
}

.btnrow .btn {
  width: 100%;
}
</style>
