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

const router = useRouter()
const { t, locale } = useI18n()
const progressStore = useProgressStore()

const showRetest = ref(false)
const retestReps = ref(0)
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

function repeatMissed() {
  if (missedSlot.value) startWorkout(missedSlot.value.date)
}

async function submitRetest() {
  await progressStore.applyRetest(retestReps.value)
  showRetest.value = false
}

async function reduceAnchor() {
  await progressStore.reduceAnchor()
  showRetest.value = false
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <p class="kicker">{{ formatDisplayDate(today, locale) }}</p>
        <h1>{{ t('home.title') }}</h1>
      </div>
      <span v-if="streakWeeks > 0" class="chip streak">{{ t('home.streakWeeks', { n: streakWeeks }) }}</span>
    </header>

    <div v-if="missedSlot" class="banner">{{ t('home.shiftBanner') }}</div>

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
        <input id="retest-reps" v-model.number="retestReps" type="number" min="0" max="100" />
      </label>
      <button type="button" class="btn accent" @click="submitRetest">{{ t('common.confirm') }}</button>
      <button type="button" class="btn ghost" @click="showRetest = false">{{ t('common.cancel') }}</button>
    </section>

    <section v-if="nextSlot" class="panel next">
      <p class="kicker">{{ isWorkoutToday ? t('home.nextWorkout') : t('home.restToday') }}</p>
      <div class="row">
        <h3>{{ formatDisplayDate(nextSlot.date, locale) }}</h3>
        <span v-if="setsPreview" class="sets">{{ setsPreview }}</span>
      </div>
      <div class="meter"><i :style="{ width: `${progressPercent}%` }" /></div>
      <p v-if="cycleInfo" class="sub">
        {{ t('home.stepProgress', { step: cycleInfo.step, cycle: cycleInfo.cycle }) }}
      </p>
      <p v-if="levelInfo" class="sub">{{ levelInfo }}</p>
      <p v-if="!isWorkoutToday" class="sub">{{ t('home.opensOn', { date: formatDisplayDate(nextSlot.date, locale) }) }}</p>
      <button
        v-if="isWorkoutToday"
        type="button"
        class="btn accent"
        @click="startWorkout(nextSlot.date)"
      >
        {{ t('common.start') }}
      </button>
      <template v-else>
        <button type="button" class="btn accent" @click="startWorkout(nextSlot.date)">
          {{ t('home.startEarly') }}
        </button>
        <RouterLink to="/calendar" class="btn ghost">{{ t('home.openCalendar') }}</RouterLink>
        <p class="sub early-hint">{{ t('home.earlyStartHint') }}</p>
      </template>
      <button v-if="missedSlot" type="button" class="btn ghost" @click="repeatMissed">
        {{ t('home.repeatMissed') }}
      </button>
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

    <div class="links">
      <RouterLink class="text-link" to="/about">{{ t('home.aboutLink') }}</RouterLink>
      <RouterLink class="text-link" to="/why">{{ t('home.whyLink') }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.chip.streak {
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 8px 12px;
  background: var(--accent2);
  color: var(--accent-ink);
  border: 2px solid var(--line);
  box-shadow: 3px 3px 0 var(--shadow);
}
.banner {
  background: var(--card);
  border: 2px solid var(--line);
  padding: 10px 12px;
  margin-bottom: 12px;
  font: 700 0.72rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.next .row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 8px 0 12px;
}
.next h3 {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.3rem;
  margin: 0;
  text-transform: uppercase;
}
.sets {
  font: 800 0.85rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--accent);
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
.field input {
  min-height: 50px;
  font-size: 1.5rem;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  padding: 0 12px;
}
.links {
  display: flex;
  gap: 16px;
  margin: 16px 0 8px;
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
}
.links a {
  color: var(--ink);
}
.early-hint {
  margin-top: 8px;
  text-align: center;
}
.next .btn {
  text-decoration: none;
}
</style>
