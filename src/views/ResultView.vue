<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

function parseNum(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

const success = computed(() => route.query.result === 'success')
const volume = computed(() => parseNum(route.query.volume))
const planned = computed(() => parseNum(route.query.planned))
const done = computed(() => parseNum(route.query.done))
const nextStep = computed(() => route.query.next)
</script>

<template>
  <div class="result panel">
    <p class="kicker">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</p>
    <p v-if="planned > 0" class="summary">{{ t('workout.resultVolume', { done, planned }) }}</p>
    <p v-else-if="volume > 0" class="summary">{{ t('workout.volume', { n: volume }) }}</p>
    <p v-if="success && nextStep" class="sub">{{ t('workout.resultNext', { step: nextStep }) }}</p>
    <p v-else-if="!success" class="sub">{{ t('workout.resultRetry') }}</p>
    <div class="btnrow">
      <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
      <button v-if="!success" type="button" class="btn ghost" @click="router.push('/calendar')">
        {{ t('nav.calendar') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.result {
  margin-top: 24px;
  text-align: center;
}
.summary {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.4rem;
  text-transform: uppercase;
  margin: 12px 0;
}
.btnrow {
  justify-content: center;
}
</style>
