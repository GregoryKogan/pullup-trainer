<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const success = computed(() => route.query.result === 'success')
const volume = computed(() => Number(route.query.volume ?? 0))
const planned = computed(() => Number(route.query.planned ?? 0))
const done = computed(() => Number(route.query.done ?? 0))
const nextStep = computed(() => route.query.next)
</script>

<template>
  <div class="result panel">
    <p class="kicker">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</p>
    <p v-if="planned > 0" class="summary">{{ t('workout.resultVolume', { done, planned }) }}</p>
    <p v-else-if="volume > 0" class="summary">{{ t('workout.volume', { n: volume }) }}</p>
    <p v-if="success && nextStep" class="sub">{{ t('workout.resultNext', { step: nextStep }) }}</p>
    <p v-else-if="!success" class="sub">{{ t('calendar.repeatMissed') }}</p>
    <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
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
</style>
