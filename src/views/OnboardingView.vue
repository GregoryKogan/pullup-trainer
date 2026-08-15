<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { recommendStart } from '@/domain/levels'
import { computeTotals } from '@/domain/progression'
import { setLocale } from '@/i18n'
import { todayLocal, toIsoOffset } from '@/utils/dates'
import { blockRepFractionKey, isValidRepCount, syncRepInput } from '@/utils/reps-input'

const step = ref<'intro' | 'test' | 'recommend'>('intro')
const reps = ref(0)
const repsError = ref('')
const recommendation = computed(() => recommendStart(reps.value))

const stepNumber = computed(() => {
  if (step.value === 'intro') return 1
  if (step.value === 'test') return 2
  return 3
})

const recommendText = computed(() => {
  const rec = recommendation.value
  const params = { ...rec.explanationParams }
  if ('level' in params && params.level) {
    params.level = t(`levels.${params.level}`)
  }
  return t(rec.explanationKey, params)
})

const router = useRouter()
const { t } = useI18n()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

function goTest() {
  step.value = 'test'
}

function goBack() {
  if (step.value === 'recommend') step.value = 'test'
  else if (step.value === 'test') step.value = 'intro'
}

function submitTest() {
  if (!isValidRepCount(reps.value)) {
    repsError.value = t('onboarding.repsInvalid')
    return
  }
  repsError.value = ''
  step.value = 'recommend'
}

function onRepsInput(event: Event) {
  syncRepInput(event, (value) => {
    reps.value = value
  })
}

async function setLang(lang: 'en' | 'ru') {
  if (settingsStore.settings) {
    await settingsStore.setLanguage(lang)
  }
  setLocale(lang)
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
    programName: t('common.programName'),
    result: 'success',
    sets: [{ position: 1, type: 'max', unit: 'reps', planned: 0, done: reps.value }],
    totals,
  })
  router.push('/')
}
</script>

<template>
  <div class="onboarding page">
    <h1 class="sr-only">{{ t('onboarding.introTitle') }}</h1>
    <div class="langrow" role="group" :aria-label="t('settings.language')">
      <button
        type="button"
        class="lang"
        :class="{ on: settingsStore.settings?.language === 'en' }"
        :aria-pressed="settingsStore.settings?.language === 'en'"
        @click="setLang('en')"
      >
        EN
      </button>
      <button
        type="button"
        class="lang"
        :class="{ on: settingsStore.settings?.language === 'ru' }"
        :aria-pressed="settingsStore.settings?.language === 'ru'"
        @click="setLang('ru')"
      >
        RU
      </button>
    </div>
    <p class="step-indicator kicker">
      <span class="step-dots" aria-hidden="true">
        <i v-for="n in 3" :key="n" :class="{ on: n === stepNumber }" />
      </span>
      {{ t('onboarding.stepOf', { current: stepNumber, total: 3 }) }}
    </p>
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
        <input
          id="onboarding-reps"
          v-model.number="reps"
          type="number"
          min="0"
          max="100"
          step="1"
          inputmode="numeric"
          :placeholder="t('onboarding.repsPlaceholder')"
          @keydown="blockRepFractionKey"
          @input="onRepsInput"
        />
      </label>
      <p v-if="repsError" class="sub error">{{ repsError }}</p>
      <p class="sub hint">{{ t('onboarding.testHint') }}</p>
      <div class="btnrow">
        <button type="button" class="btn ghost" @click="goBack">{{ t('common.back') }}</button>
        <button type="button" class="btn accent" @click="submitTest">{{ t('common.next') }}</button>
      </div>
    </section>
    <section v-else class="panel">
      <p class="kicker">{{ t('onboarding.recommendTitle') }}</p>
      <p>{{ recommendText }}</p>
      <button type="button" class="btn accent" @click="accept">{{ t('onboarding.accept') }}</button>
      <div class="btnrow">
        <button type="button" class="btn ghost" @click="goBack">{{ t('common.back') }}</button>
        <button type="button" class="btn ghost" @click="step = 'test'">{{ t('onboarding.override') }}</button>
      </div>
    </section>
    <div class="links page-bottom">
      <RouterLink class="text-link" to="/about">{{ t('home.aboutLink') }}</RouterLink>
      <RouterLink class="text-link" to="/why">{{ t('home.whyLink') }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.langrow {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.step-indicator {
  margin-bottom: 14px;
  padding: 6px 9px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.step-dots {
  display: inline-flex;
  gap: 6px;
}
.step-dots i {
  width: 10px;
  height: 10px;
  border: 2px solid var(--line);
  background: var(--card);
  display: block;
}
.step-dots i.on {
  background: var(--accent);
  border-color: var(--line);
}
.lang {
  min-height: 44px;
  min-width: 44px;
  padding: 0 12px;
  border: 2px solid var(--line);
  background: var(--card);
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  cursor: pointer;
  color: var(--ink);
}
.lang.on {
  background: var(--accent);
  color: var(--accent-ink);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.field input {
  min-height: 50px;
  font: 800 1.5rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  border: 2px solid var(--line);
  padding: 8px 12px;
  background: var(--bg);
  color: var(--ink);
}
.links {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
}
.links a {
  color: var(--ink);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 8px 4px;
}
.sub.error {
  color: var(--bad);
}
.hint {
  margin: 0 0 12px;
}
</style>
