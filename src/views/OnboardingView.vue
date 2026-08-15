<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { recommendStart } from '@/domain/levels'
import { computeTotals } from '@/domain/progression'
import { todayLocal, toIsoOffset } from '@/utils/dates'

const step = ref<'intro' | 'test' | 'recommend'>('intro')
const reps = ref(0)
const recommendation = computed(() => recommendStart(reps.value))

const router = useRouter()
const { t } = useI18n()
const progressStore = useProgressStore()

function goTest() {
  step.value = 'test'
}

function submitTest() {
  step.value = 'recommend'
}

async function accept() {
  await progressStore.initFromTest(reps.value)
  const totals = computeTotals([{ position: 1, type: 'max', unit: 'reps', planned: 0, done: reps.value }])
  await progressStore.saveRecord({
    date: todayLocal(),
    startedAt: toIsoOffset(new Date()),
    finishedAt: toIsoOffset(new Date()),
    durationSeconds: 0,
    kind: 'test',
    program: 'builtin',
    programName: 'Pull-up Trainer',
    result: 'success',
    sets: [{ position: 1, type: 'max', unit: 'reps', planned: 0, done: reps.value }],
    totals,
  })
  router.push('/')
}
</script>

<template>
  <div class="onboarding">
    <section v-if="step === 'intro'" class="panel">
      <p class="kicker">{{ t('onboarding.introTitle') }}</p>
      <p>{{ t('onboarding.introBody') }}</p>
      <button type="button" class="btn accent" @click="goTest">{{ t('common.next') }}</button>
    </section>
    <section v-else-if="step === 'test'" class="panel">
      <p class="kicker">{{ t('onboarding.testTitle') }}</p>
      <p>{{ t('onboarding.testBody') }}</p>
      <label class="field">
        <span>{{ t('onboarding.repsLabel') }}</span>
        <input v-model.number="reps" type="number" min="0" max="100" />
      </label>
      <button type="button" class="btn accent" @click="submitTest">{{ t('common.next') }}</button>
    </section>
    <section v-else class="panel">
      <p class="kicker">{{ t('onboarding.recommendTitle') }}</p>
      <p>{{ t(recommendation.explanationKey, recommendation.explanationParams) }}</p>
      <button type="button" class="btn accent" @click="accept">{{ t('onboarding.accept') }}</button>
      <button type="button" class="btn ghost" @click="step = 'test'">{{ t('onboarding.override') }}</button>
    </section>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.field input {
  min-height: 50px;
  font-size: 1.5rem;
  border: 2px solid var(--line);
  padding: 8px 12px;
  background: var(--bg);
  color: var(--ink);
}
</style>
