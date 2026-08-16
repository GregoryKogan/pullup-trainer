<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { getCustomProgram } from '@/db/repositories/custom-programs'
import { session } from '@/domain/session'
import { detectReturnPolicy } from '@/domain/schedule'
import { needsRetest } from '@/domain/progression'
import { computeWeeklyStreak } from '@/utils/streak'
import { formatDisplayDate, startOfWeek, todayLocal } from '@/utils/dates'
import { blockRepFractionKey, isValidRepCount, syncRepInput } from '@/utils/reps-input'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const router = useRouter()
const { t, locale } = useI18n()
const progressStore = useProgressStore()

const showRetest = ref(false)
const showStartConfirm = ref(false)
const retestReps = ref(0)
const retestError = ref('')
const customPlanPreview = ref('')
const today = todayLocal()

const nextSlot = computed(() => progressStore.getNextSlot())
const missedSlot = computed(() => progressStore.getMissedSlot())
const isWorkoutToday = computed(() => nextSlot.value?.date === today)

const setsPreview = computed(() => {
  const p = progressStore.progress
  if (!p || !nextSlot.value) return ''
  if (p.source === 'builtin' && p.state.path === 'L') {
    const s = session(p.state.anchor, nextSlot.value.stepRef)
    const parts = s.sets.map((x) =>
      x.type === 'max' ? t('home.planMax') : String(x.planned),
    )
    return t('home.planPreview', { sets: parts.join(' + ') })
  }
  if (p.source === 'builtin' && p.state.path === 'P0') {
    return t('home.path0Step', { step: nextSlot.value.stepRef })
  }
  return customPlanPreview.value
})

watch(
  () => [progressStore.progress, nextSlot.value] as const,
  async ([p, slot]) => {
    if (!p || p.source !== 'custom' || !slot) {
      customPlanPreview.value = ''
      return
    }
    const program = await getCustomProgram(p.customProgramId)
    const step = program?.steps[slot.stepRef]
    if (!step) {
      customPlanPreview.value = ''
      return
    }
    const parts = step.sets.map((x) =>
      x.type === 'max' ? t('home.planMax') : String(x.planned),
    )
    customPlanPreview.value = t('home.planPreview', { sets: parts.join(' + ') })
  },
  { immediate: true },
)

const maxReps = computed(() => {
  let max = 0
  for (const r of progressStore.records) {
    max = Math.max(max, r.totals.maxSetReps)
    if (r.kind === 'test') {
      max = Math.max(max, r.sets[0]?.done ?? 0)
    }
  }
  return max
})

const weekVolume = computed(() => {
  const start = startOfWeek(today)
  return progressStore.records
    .filter((r) => r.date >= start && r.kind === 'workout')
    .reduce((sum, r) => sum + r.totals.volumeReps, 0)
})

const cycleInfo = computed(() => {
  const p = progressStore.progress
  if (!p || p.source !== 'builtin' || p.state.path !== 'L') return null
  return { step: p.state.stepInCycle, cycle: p.state.cycleIndex + 1 }
})

const progressPercent = computed(() => {
  const p = progressStore.progress
  if (!p || p.source !== 'builtin') return 0
  if (p.state.path === 'P0') return Math.round((p.state.path0Step / 12) * 100)
  return Math.round((p.state.stepInCycle / 6) * 100)
})

const levelInfo = computed(() => {
  const p = progressStore.progress
  if (!p || p.source !== 'builtin') return null
  if (p.state.path === 'P0') return t('home.path0Step', { step: p.state.path0Step })
  return t('home.levelAnchor', {
    level: t(`levels.${p.state.level}`),
    anchor: p.state.anchor,
  })
})

const streakWeeks = computed(() => {
  const p = progressStore.progress
  const freq = p?.source === 'builtin' ? p.frequencyDays : 3
  return computeWeeklyStreak(progressStore.records, freq, today)
})

const needsRetestPrompt = computed(() => {
  const p = progressStore.progress
  if (!p || p.source !== 'builtin') return false
  if (detectReturnPolicy(p.lastWorkoutDate, today) === 'retest') return true
  if (p.state.path === 'L') {
    return needsRetest(p.state.lastRetestDate, p.state.cycleIndex, today, p.lastWorkoutDate)
  }
  return false
})

function startWorkout(date?: string) {
  router.push(date ? `/workout/${date}` : '/workout')
}

function requestEarlyStart() {
  showStartConfirm.value = true
}

function confirmEarlyStart() {
  showStartConfirm.value = false
  if (nextSlot.value) startWorkout(nextSlot.value.date)
}

function repeatMissed() {
  if (missedSlot.value) startWorkout(missedSlot.value.date)
}

async function submitRetest() {
  if (!isValidRepCount(retestReps.value)) {
    retestError.value = t('onboarding.repsInvalid')
    return
  }
  retestError.value = ''
  await progressStore.applyRetest(retestReps.value)
  showRetest.value = false
}

function onRetestRepsInput(event: Event) {
  syncRepInput(event, (value) => {
    retestReps.value = value
  })
}

async function reduceAnchor() {
  await progressStore.reduceAnchor()
  showRetest.value = false
}
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <p class="kicker">{{ formatDisplayDate(today, locale) }}</p>
        <h1 v-if="nextSlot">{{ isWorkoutToday ? t('home.nextWorkout') : t('home.restToday') }}</h1>
        <p v-if="nextSlot && !isWorkoutToday" class="sub opens-on">
          {{ t('home.opensOn', { date: formatDisplayDate(nextSlot.date, locale) }) }}
        </p>
        <h1 v-else>{{ t('home.title') }}</h1>
      </div>
      <span v-if="streakWeeks > 0" class="chip streak">
        <AppIcon name="flame" :size="16" />
        {{ t('home.streakWeeks', { n: streakWeeks }) }}
      </span>
    </header>

    <div v-if="missedSlot" class="banner">
      <AppIcon name="bell" :size="15" />
      {{ t('home.shiftBanner') }}
    </div>

    <section v-if="needsRetestPrompt && !showRetest" class="panel retest">
      <p class="kicker">{{ t('home.retestTitle') }}</p>
      <p class="sub">{{ t('home.retestBody') }}</p>
      <div class="btnrow">
        <button type="button" class="btn accent" @click="showRetest = true">{{ t('home.retestNow') }}</button>
        <button type="button" class="btn ghost" @click="reduceAnchor">{{ t('home.retestReduce') }}</button>
      </div>
    </section>

    <section v-if="showRetest" class="panel retest">
      <p class="kicker">{{ t('onboarding.testTitle') }}</p>
      <label class="field">
        <span>{{ t('onboarding.repsLabel') }}</span>
        <input
          id="retest-reps"
          v-model.number="retestReps"
          type="number"
          min="0"
          max="100"
          step="1"
          inputmode="numeric"
          :placeholder="t('onboarding.repsPlaceholder')"
          @keydown="blockRepFractionKey"
          @input="onRetestRepsInput"
        />
      </label>
      <p v-if="retestError" class="sub error">{{ retestError }}</p>
      <p class="sub hint">{{ t('onboarding.testHint') }}</p>
      <button type="button" class="btn accent" @click="submitRetest">{{ t('common.confirm') }}</button>
      <button type="button" class="btn ghost" @click="showRetest = false">{{ t('common.cancel') }}</button>
    </section>

    <section v-if="nextSlot" class="panel next">
      <div class="row">
        <h2 class="workout-date">{{ formatDisplayDate(nextSlot.date, locale) }}</h2>
        <span v-if="setsPreview" class="sets">{{ setsPreview }}</span>
      </div>
      <div class="meter"><i :style="{ width: `${progressPercent}%` }" /></div>
      <p v-if="cycleInfo" class="sub">
        {{ t('home.stepProgress', { step: cycleInfo.step, cycle: cycleInfo.cycle }) }}
      </p>
      <p v-if="levelInfo" class="sub">{{ levelInfo }}</p>
      <button
        v-if="isWorkoutToday"
        type="button"
        class="btn accent"
        @click="startWorkout(nextSlot.date)"
      >
        {{ t('common.start') }}
        <AppIcon name="arrow-right" />
      </button>
      <template v-else>
        <button type="button" class="btn accent" @click="requestEarlyStart">
          {{ t('home.startEarly') }}
          <AppIcon name="arrow-right" />
        </button>
        <button v-if="missedSlot" type="button" class="btn ghost" @click="repeatMissed">
          {{ t('home.repeatMissed') }}
        </button>
        <RouterLink to="/calendar" class="btn ghost calendar-link">{{ t('home.openCalendar') }}</RouterLink>
      </template>
    </section>
    <p v-else class="sub">{{ t('home.noProgress') }}</p>

    <div class="grid2">
      <section class="panel tile">
        <p class="kicker">{{ t('home.maxReps') }}</p>
        <b class="big">{{ maxReps }}</b>
      </section>
      <section class="panel tile">
        <p class="kicker">{{ t('home.volumeWeek') }}</p>
        <b class="big">{{ weekVolume }}</b>
      </section>
    </div>

    <ConfirmPanel
      :visible="showStartConfirm"
      :title="t('common.earlyStartTitle')"
      :message="t('common.earlyStartConfirm')"
      @confirm="confirmEarlyStart"
      @cancel="showStartConfirm = false"
    />
  </div>
</template>

<style scoped>
.chip.streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 8px 12px;
  background: var(--accent2);
  color: var(--accent-ink);
  border: 2px solid var(--line);
  box-shadow: 3px 3px 0 var(--shadow);
}
.banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--card);
  border: 2px solid var(--line);
  padding: 10px 12px;
  margin-bottom: 12px;
  font: 700 0.72rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.banner svg {
  color: var(--muted);
}
.next h2.workout-date {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.3rem;
  margin: 0;
  text-transform: uppercase;
}
.next .row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 8px 0 12px;
}
.sets {
  font: 800 0.85rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--accent);
  text-align: right;
  flex: 1 1 140px;
}
.meter {
  height: 10px;
  background: var(--bg2);
  border: 2px solid var(--line);
  margin: 8px 0 10px;
}
.meter i {
  display: block;
  height: 100%;
  background: var(--accent);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.hint {
  margin: 0 0 12px;
}
.sub.error {
  color: var(--bad);
}
.field input {
  min-height: 50px;
  font: 800 1.5rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  padding: 0 12px;
}
.opens-on {
  margin: 4px 0 0;
  font: 700 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
}
.next .btn {
  text-decoration: none;
}
</style>
