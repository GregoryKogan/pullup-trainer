<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { recommendStart } from '@/domain/levels'
import { computeTotals } from '@/domain/progression'
import { todayLocal, toIsoOffset } from '@/utils/dates'
import {
  blockRepFractionKey,
  clampTestRepCount,
  isValidTestRepCount,
  REP_COUNT_MAX,
  REP_COUNT_MIN,
  syncTestRepInput,
} from '@/utils/reps-input'
import AppIcon from '@/components/icons/AppIcon.vue'
import IconPullUp from '@/components/icons/pullup/IconPullUp.vue'

const step = ref<'intro' | 'test' | 'recommend'>('intro')
const reps = ref(1)
const repsError = ref('')
const showZeroMessage = ref(false)
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

const repsAtMin = computed(() => reps.value <= REP_COUNT_MIN)
const repsAtMax = computed(() => reps.value >= REP_COUNT_MAX)

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
  showZeroMessage.value = false
  if (reps.value === 0) {
    repsError.value = t('onboarding.zeroNotSupported')
    showZeroMessage.value = true
    return
  }
  if (!isValidTestRepCount(reps.value)) {
    repsError.value = t('onboarding.repsInvalid')
    return
  }
  repsError.value = ''
  step.value = 'recommend'
}

function onRepsInput(event: Event) {
  showZeroMessage.value = false
  syncTestRepInput(event, (value) => {
    reps.value = value
    if (value === 0) {
      repsError.value = t('onboarding.zeroNotSupported')
      showZeroMessage.value = true
    } else {
      repsError.value = ''
    }
  })
}

function adjustReps(delta: number) {
  reps.value = clampTestRepCount(reps.value + delta)
  repsError.value = ''
  showZeroMessage.value = false
}

function openZeroMessage() {
  showZeroMessage.value = true
  repsError.value = ''
}

async function setLang(lang: 'en' | 'ru') {
  await settingsStore.setLanguage(lang)
}

async function accept() {
  await progressStore.initFromTest(reps.value)
  const totals = computeTotals([{ position: 1, type: 'max', planned: 0, done: reps.value }])
  await progressStore.saveRecord({
    date: todayLocal(),
    startedAt: toIsoOffset(new Date()),
    finishedAt: toIsoOffset(new Date()),
    durationSeconds: 0,
    kind: 'test',
    program: 'builtin',
    programName: t('common.programName'),
    result: 'success',
    sets: [{ position: 1, type: 'max', planned: 0, done: reps.value }],
    totals,
  })
  router.push('/')
}
</script>

<template>
  <div class="onboarding page">
    <h1 class="sr-only">{{ t('onboarding.introTitle') }}</h1>
    <p class="step-indicator kicker">
      <span class="step-dots" aria-hidden="true">
        <i v-for="n in 3" :key="n" :class="{ on: n <= stepNumber }" />
      </span>
      {{ t('onboarding.stepOf', { current: stepNumber, total: 3 }) }}
    </p>
    <section v-if="step === 'intro'" class="panel">
      <p class="kicker">{{ t('onboarding.introTitle') }}</p>
      <p>{{ t('onboarding.introBody') }}</p>
      <button type="button" class="btn accent" @click="goTest">{{ t('common.next') }}</button>
    </section>
    <section v-else-if="step === 'test'" class="panel">
      <div class="test-head">
        <IconPullUp :size="28" class="test-icon" />
        <p class="kicker">{{ t('onboarding.testTitle') }}</p>
      </div>
      <p>{{ t('onboarding.testBody') }}</p>
      <label class="field">
        <span>{{ t('onboarding.repsLabel') }}</span>
        <div class="rep-stepper">
          <button
            type="button"
            class="iconbtn rep-step"
            :class="{ inactive: repsAtMin }"
            :aria-label="t('onboarding.repsDecrease')"
            :disabled="repsAtMin"
            @click="adjustReps(-1)"
          >
            <AppIcon name="minus" />
          </button>
          <input
            id="onboarding-reps"
            v-model.number="reps"
            type="number"
            min="1"
            :max="REP_COUNT_MAX"
            step="1"
            inputmode="numeric"
            :placeholder="t('onboarding.repsPlaceholder')"
            @keydown="blockRepFractionKey"
            @input="onRepsInput"
          />
          <button
            type="button"
            class="iconbtn rep-step"
            :class="{ inactive: repsAtMax }"
            :aria-label="t('onboarding.repsIncrease')"
            :disabled="repsAtMax"
            @click="adjustReps(1)"
          >
            <AppIcon name="plus" />
          </button>
        </div>
      </label>
      <p v-if="repsError" class="sub error">{{ repsError }}</p>
      <p class="sub hint">{{ t('onboarding.testHint') }}</p>
      <button type="button" class="text-link zero-link" @click="openZeroMessage">
        {{ t('onboarding.cannotDoPullupsLink') }}
      </button>
      <div v-if="showZeroMessage" class="panel zero-panel">
        <p class="kicker">{{ t('onboarding.cannotDoPullupsTitle') }}</p>
        <p>{{ t('onboarding.cannotDoPullupsBody') }}</p>
      </div>
      <div class="btnrow">
        <button type="button" class="btn ghost" @click="goBack">{{ t('common.back') }}</button>
        <button type="button" class="btn accent" @click="submitTest">{{ t('common.next') }}</button>
      </div>
    </section>
    <section v-else class="panel">
      <p class="kicker">{{ t('onboarding.recommendTitle') }}</p>
      <p>{{ recommendText }}</p>
      <button type="button" class="btn accent" @click="accept">{{ t('onboarding.accept') }}</button>
      <button type="button" class="btn ghost" @click="goBack">{{ t('onboarding.override') }}</button>
    </section>
    <div class="onboarding-foot page-bottom">
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
      <div class="links">
        <RouterLink class="text-link" to="/about">{{ t('home.aboutLink') }}</RouterLink>
        <RouterLink class="text-link" to="/why">{{ t('home.whyLink') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding.page {
  padding-top: 12px;
}
.langrow {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 4px;
}
.step-indicator {
  margin-bottom: 14px;
  padding: 6px 9px;
  display: inline-flex;
  align-self: flex-start;
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
  border: 2px solid var(--accent-ink);
  background: transparent;
  display: block;
}
.step-dots i.on {
  background: var(--accent-ink);
}
.test-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.test-head .kicker {
  margin-bottom: 0;
}
.test-icon {
  flex-shrink: 0;
  color: var(--accent-text);
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
.rep-stepper {
  display: flex;
  align-items: stretch;
  gap: 10px;
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
.zero-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--ink);
  background: none;
  border: 0;
  cursor: pointer;
  text-decoration: underline;
}
.zero-panel {
  margin-bottom: 14px;
  background: var(--bg2);
}
</style>
