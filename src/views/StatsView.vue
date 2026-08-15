<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { exportHistory } from '@/domain/export'
import { APP_VERSION } from '@/constants/app'
import { downloadJson } from '@/utils/platform'
import { computeWeeklyStreak } from '@/utils/streak'
import { formatShortDate, startOfWeek, todayLocal } from '@/utils/dates'

const { t, locale } = useI18n()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const maxReps = computed(() => {
  const points: { date: string; value: number }[] = []
  for (const r of [...progressStore.records].reverse()) {
    let v = r.totals.maxSetReps
    if (r.kind === 'test') v = r.sets[0]?.done ?? 0
    if (v > 0) points.push({ date: r.date, value: v })
  }
  return points.slice(-6)
})

const weeklyBars = computed(() => {
  const map = new Map<string, number>()
  for (const r of progressStore.records) {
    if (r.kind !== 'workout') continue
    const w = startOfWeek(r.date)
    map.set(w, (map.get(w) ?? 0) + r.totals.volumeReps)
  }
  return [...map.entries()].slice(-7).map(([week, vol]) => ({ week, vol }))
})

const totalVolume = computed(() =>
  progressStore.records.reduce((s, r) => s + r.totals.volumeReps, 0),
)

const streakWeeks = computed(() => {
  const p = progressStore.progress
  const freq = p?.source === 'builtin' ? p.frequencyDays : 3
  return computeWeeklyStreak(progressStore.records, freq, todayLocal())
})

const historyLimit = 10
const showAllHistory = ref(false)
const isNarrow = ref(false)
let narrowMq: MediaQueryList | null = null

function updateNarrow() {
  isNarrow.value = narrowMq?.matches ?? false
}

onMounted(() => {
  narrowMq = window.matchMedia('(max-width: 420px)')
  updateNarrow()
  narrowMq.addEventListener('change', updateNarrow)
})

onBeforeUnmount(() => {
  narrowMq?.removeEventListener('change', updateNarrow)
})

const displayMaxReps = computed(() => {
  const pts = maxReps.value
  return isNarrow.value && pts.length > 4 ? pts.slice(-4) : pts
})

const displayWeeklyBars = computed(() => {
  const bars = weeklyBars.value
  return isNarrow.value && bars.length > 4 ? bars.slice(-4) : bars
})

function chartX(index: number, count: number, start = 30, end = 330) {
  if (count <= 1) return (start + end) / 2
  return start + (index * (end - start)) / (count - 1)
}

const history = computed(() =>
  showAllHistory.value ? progressStore.records : progressStore.records.slice(0, historyLimit),
)

const hasMoreHistory = computed(() => progressStore.records.length > historyLimit)

function chartY(value: number, max: number) {
  if (max <= 0) return 130
  return 130 - (value / max) * 100
}

const maxChartMax = computed(() => Math.max(1, ...maxReps.value.map((p) => p.value)))

const weeklyChartMax = computed(() => Math.max(1, ...weeklyBars.value.map((b) => b.vol)))

function recordLabel(r: (typeof progressStore.records)[0]) {
  if (r.kind === 'test') return `${r.sets[0]?.done ?? 0} ${t('workout.reps')}`
  const sets = r.sets.map((s) => s.done).join('·')
  return sets || '—'
}

function chartDateLabel(date: string) {
  return formatShortDate(date, locale.value)
}

function exportHistoryJson() {
  const lang = settingsStore.settings?.language ?? 'en'
  const data = exportHistory(progressStore.records, APP_VERSION, lang)
  downloadJson('pullup-trainer-history.json', data)
}
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <p class="kicker">{{ t('stats.kicker') }}</p>
        <h1>{{ t('stats.title') }}</h1>
      </div>
    </header>
    <div class="kpis">
      <div class="kpi">
        <b>{{ maxReps[maxReps.length - 1]?.value ?? 0 }}</b>
        <span>{{ t('stats.maxReps') }}</span>
      </div>
      <div class="kpi">
        <b class="streak-num">{{ streakWeeks }}</b>
        <span>{{ streakWeeks > 0 ? t('stats.streakWeeks', { n: streakWeeks }) : t('stats.noStreak') }}</span>
      </div>
      <div class="kpi">
        <b>{{ totalVolume }}</b>
        <span>{{ t('stats.volume') }}</span>
      </div>
    </div>
    <section class="sec">
      <h4>{{ t('stats.maxChart') }}</h4>
      <p class="sub">{{ t('stats.maxChartSub') }}</p>
      <p v-if="maxReps.length === 0" class="sub chart-empty">{{ t('stats.chartEmpty') }}</p>
      <div v-else class="chart-wrap">
        <svg class="chart" viewBox="0 0 354 158" role="img" :aria-label="t('stats.maxChart')">
          <title>{{ t('stats.maxChart') }}</title>
          <text class="chart-tick" x="24" y="134" text-anchor="end">0</text>
          <text class="chart-tick" x="24" :y="chartY(maxChartMax, maxChartMax) + 4" text-anchor="end">
            {{ maxChartMax }}
          </text>
          <line x1="30" y1="130" x2="330" y2="130" stroke="var(--line)" stroke-width="2" />
          <line
            v-for="i in 4"
            :key="`grid-${i}`"
            x1="30"
            :y1="130 - i * 25"
            x2="330"
            :y2="130 - i * 25"
            stroke="var(--line)"
            stroke-width="1"
            opacity="0.35"
          />
          <polyline
            v-if="displayMaxReps.length > 1"
            class="line"
            :points="displayMaxReps.map((p, i) => `${chartX(i, displayMaxReps.length)},${chartY(p.value, maxChartMax)}`).join(' ')"
            fill="none"
            stroke="var(--accent)"
            stroke-width="2.5"
          />
          <g v-for="(p, i) in displayMaxReps" :key="p.date">
            <circle
              :cx="chartX(i, displayMaxReps.length)"
              :cy="chartY(p.value, maxChartMax)"
              r="5"
              fill="var(--accent)"
            />
            <text class="chart-label" :x="chartX(i, displayMaxReps.length)" y="148" text-anchor="middle">
              {{ chartDateLabel(p.date) }}
            </text>
            <text
              class="chart-val"
              :x="chartX(i, displayMaxReps.length)"
              :y="chartY(p.value, maxChartMax) - 8"
              text-anchor="middle"
            >
              {{ p.value }}
            </text>
          </g>
        </svg>
      </div>
      <ul v-if="maxReps.length > 0" class="sr-only">
        <li v-for="p in maxReps" :key="p.date">
          {{ chartDateLabel(p.date) }}: {{ p.value }} {{ t('stats.maxReps') }}
        </li>
      </ul>
    </section>
    <section class="sec">
      <h4>{{ t('stats.weeklyVolume') }}</h4>
      <p v-if="weeklyBars.length === 0" class="sub chart-empty">{{ t('stats.chartEmpty') }}</p>
      <div v-else class="chart-wrap">
        <svg class="chart" viewBox="0 0 354 148" role="img" :aria-label="t('stats.weeklyVolume')">
          <title>{{ t('stats.weeklyVolume') }}</title>
          <text class="chart-tick" x="24" y="134" text-anchor="end">0</text>
          <text class="chart-tick" x="24" :y="chartY(weeklyChartMax, weeklyChartMax) + 4" text-anchor="end">
            {{ weeklyChartMax }}
          </text>
          <line x1="30" y1="130" x2="330" y2="130" stroke="var(--line)" stroke-width="2" />
          <line
            v-for="i in 4"
            :key="`vgrid-${i}`"
            x1="30"
            :y1="130 - i * 25"
            x2="330"
            :y2="130 - i * 25"
            stroke="var(--line)"
            stroke-width="1"
            opacity="0.35"
          />
          <g v-for="(b, i) in displayWeeklyBars" :key="b.week">
            <rect
              class="bar"
              :x="chartX(i, displayWeeklyBars.length) - 13"
              :y="chartY(b.vol, weeklyChartMax)"
              width="26"
              :height="130 - chartY(b.vol, weeklyChartMax)"
              fill="var(--accent)"
            />
            <text class="chart-label" :x="chartX(i, displayWeeklyBars.length)" y="144" text-anchor="middle">
              {{ chartDateLabel(b.week) }}
            </text>
            <text
              v-if="b.vol > 0"
              class="chart-val"
              :x="chartX(i, displayWeeklyBars.length)"
              :y="chartY(b.vol, weeklyChartMax) - 6"
              text-anchor="middle"
            >
              {{ b.vol }}
            </text>
          </g>
        </svg>
      </div>
      <ul v-if="weeklyBars.length > 0" class="sr-only">
        <li v-for="b in weeklyBars" :key="b.week">
          {{ chartDateLabel(b.week) }}: {{ b.vol }} {{ t('stats.volume') }}
        </li>
      </ul>
    </section>
    <section class="sec page-bottom">
      <h4>{{ t('stats.history') }}</h4>
      <ul class="hist">
        <li v-for="r in history" :key="r.id ?? r.startedAt">
          <div class="date">
            <b>{{ formatShortDate(r.date, locale) }}</b>
            <span>{{ r.kind === 'test' ? t('onboarding.testTitle') : r.programName }}</span>
          </div>
          <div class="info"><b>{{ recordLabel(r) }}</b></div>
          <span class="pill" :class="r.result === 'success' ? 'ok' : 'part'">{{
            r.result === 'success' ? t('stats.success') : t('stats.partial')
          }}</span>
        </li>
      </ul>
      <button
        v-if="hasMoreHistory"
        type="button"
        class="btn ghost history-toggle"
        @click="showAllHistory = !showAllHistory"
      >
        {{ showAllHistory ? t('stats.showLess') : t('stats.showAll') }}
      </button>
      <button type="button" class="btn accent" @click="exportHistoryJson">{{ t('stats.export') }}</button>
    </section>
  </div>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.kpi {
  background: var(--card);
  border: 2px solid var(--line);
  box-shadow: 4px 4px 0 var(--shadow);
  padding: 14px 10px;
  text-align: center;
}
.kpi b {
  display: block;
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.7rem;
}
.kpi .streak-num {
  font-size: 1.7rem;
}
.kpi span {
  font: 700 0.68rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
@media (max-width: 420px) {
  .kpis {
    grid-template-columns: 1fr;
  }
  .kpi b,
  .kpi .streak-num {
    font-size: 2rem;
  }
}
.chart-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.chart-empty {
  margin: 12px 0 4px;
}
.chart {
  width: 100%;
  min-width: 280px;
}
@media (max-width: 420px) {
  .chart-tick,
  .chart-label {
    font-size: 9px;
  }
  .chart-val {
    font-size: 10px;
  }
}
.chart-tick,
.chart-label,
.chart-val {
  font: 700 11px/1 ui-monospace, 'SF Mono', Menlo, monospace;
  fill: var(--muted);
}
.chart-val {
  fill: var(--ink);
  font-size: 12px;
}
.hist {
  list-style: none;
  padding: 0;
  margin: 0;
}
.hist li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 2px solid var(--line);
}
.hist .date {
  flex: 0 0 auto;
  min-width: 0;
}
.hist .date b {
  display: block;
  font: 800 0.86rem/1.2 ui-monospace, 'SF Mono', Menlo, monospace;
}
.hist .date span {
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.hist .info {
  flex: 1;
  min-width: 0;
}
.hist .info b {
  display: block;
  font: 800 0.85rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
}
.pill {
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 4px 8px;
  border: 2px solid var(--line);
  text-transform: uppercase;
  margin-left: auto;
}
.pill.ok {
  color: var(--ok);
}
.pill.part {
  color: var(--warn);
}
.history-toggle {
  margin-bottom: 8px;
}
</style>
