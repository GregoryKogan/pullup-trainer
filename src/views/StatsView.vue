<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { exportHistory } from '@/domain/export'
import { APP_VERSION } from '@/constants/app'
import { downloadJson } from '@/utils/platform'
import AppIcon from '@/components/icons/AppIcon.vue'
import IconTrendingUp from '@/components/icons/lucide/IconTrendingUp.vue'
import IconActivity from '@/components/icons/lucide/IconActivity.vue'
import IconFlame from '@/components/icons/lucide/IconFlame.vue'
import IconPullUp from '@/components/icons/pullup/IconPullUp.vue'
import { computeWeeklyStreak } from '@/utils/streak'
import { formatMonthLabel, formatShortDate, startOfWeek, todayLocal } from '@/utils/dates'
import {
  CHART_TICK_X,
  CHART_X_END,
  CHART_X_START,
  CHART_Y_BASE,
  buildMaxRepsPoints,
  buildWeeklyBars,
  chartX,
  chartY,
  shouldShowChartDateLabel,
  shouldShowChartValueLabel,
  shouldShowWeeklyValueLabel,
  sliceForDisplay,
} from '@/utils/stats-chart'

const { t, locale } = useI18n()
const progressStore = useProgressStore()
const settingsStore = useSettingsStore()

const maxReps = computed(() => buildMaxRepsPoints(progressStore.records))

const weeklyBars = computed(() => buildWeeklyBars(progressStore.records))

const weekVolume = computed(() => {
  const start = startOfWeek(todayLocal())
  return progressStore.records
    .filter((r) => r.date >= start && r.kind === 'workout')
    .reduce((sum, r) => sum + r.totals.volumeReps, 0)
})

const streakWeeks = computed(() => {
  const p = progressStore.progress
  const freq = p?.frequencyDays ?? 3
  return computeWeeklyStreak(progressStore.records, freq, todayLocal())
})

const levelInfo = computed(() => {
  const p = progressStore.progress
  if (!p) return null
  return t('home.levelAnchor', {
    level: t(`levels.${p.state.level}`),
    anchor: p.state.anchor,
  })
})

const historyLimit = 10
const showAllHistory = ref(false)
const historyMonthFilter = ref('')
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

const displayMaxReps = computed(() => sliceForDisplay(maxReps.value, isNarrow.value))

const displayWeeklyBars = computed(() => sliceForDisplay(weeklyBars.value, isNarrow.value))

const displayMaxRepsValues = computed(() => displayMaxReps.value.map((p) => p.value))

const displayWeeklyValues = computed(() => displayWeeklyBars.value.map((b) => b.vol))

const filteredRecords = computed(() => {
  if (!historyMonthFilter.value) return progressStore.records
  return progressStore.records.filter((r) => r.date.startsWith(historyMonthFilter.value))
})

const history = computed(() =>
  showAllHistory.value ? filteredRecords.value : filteredRecords.value.slice(0, historyLimit),
)

const hasMoreHistory = computed(() => filteredRecords.value.length > historyLimit)

const historyMonths = computed(() => {
  const months = new Set(progressStore.records.map((r) => r.date.slice(0, 7)))
  return [...months].sort().reverse()
})

const maxChartMax = computed(() => Math.max(1, ...displayMaxRepsValues.value))

const weeklyChartMax = computed(() => Math.max(1, ...displayWeeklyValues.value))

function recordLabel(r: (typeof progressStore.records)[0]) {
  if (r.kind === 'test') return t('workout.repsCount', r.sets[0]?.done ?? 0)
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
  <div class="page page-end-space">
    <header class="head">
      <div>
        <p class="kicker">{{ t('stats.kicker') }}</p>
        <h1>{{ t('stats.title') }}</h1>
        <p v-if="levelInfo" class="sub level-info">{{ levelInfo }}</p>
      </div>
    </header>
    <div class="kpis">
      <div class="kpi">
        <span class="kpi-label">
          <IconTrendingUp :size="14" class="kpi-icon" />
          {{ t('stats.lastSessionBestSet') }}
        </span>
        <b>{{ maxReps[maxReps.length - 1]?.value ?? 0 }}</b>
      </div>
      <div class="kpi">
        <span class="kpi-label">
          <IconPullUp :size="14" class="kpi-icon" />
          {{ t('stats.repsThisWeek') }}
        </span>
        <b>{{ weekVolume }}</b>
      </div>
      <div class="kpi">
        <span class="kpi-label">
          <IconFlame :size="14" class="kpi-icon" />
          {{ t('stats.weeklyStreakLabel') }}
        </span>
        <b class="streak-num">{{ streakWeeks }}</b>
      </div>
    </div>
    <section class="sec">
      <h4 class="sec-head">
        <IconTrendingUp :size="18" class="sec-icon" />
        {{ t('stats.maxChart') }}
      </h4>
      <p class="sub">{{ t('stats.maxChartSub') }}</p>
      <p v-if="maxReps.length === 0" class="sub chart-empty">{{ t('stats.chartEmpty') }}</p>
      <div v-else class="chart-wrap">
        <svg class="chart" viewBox="0 0 372 158" role="img" :aria-label="t('stats.maxChart')">
          <title>{{ t('stats.maxChart') }}</title>
          <text class="chart-tick" :x="CHART_TICK_X" :y="CHART_Y_BASE + 4" text-anchor="end">0</text>
          <text
            class="chart-tick"
            :x="CHART_TICK_X"
            :y="chartY(maxChartMax, maxChartMax) + 4"
            text-anchor="end"
          >
            {{ maxChartMax }}
          </text>
          <line
            :x1="CHART_X_START"
            :y1="CHART_Y_BASE"
            :x2="CHART_X_END"
            :y2="CHART_Y_BASE"
            stroke="var(--line)"
            stroke-width="2"
          />
          <line
            v-for="i in 4"
            :key="`grid-${i}`"
            :x1="CHART_X_START"
            :y1="CHART_Y_BASE - i * 25"
            :x2="CHART_X_END"
            :y2="CHART_Y_BASE - i * 25"
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
            <text
              v-if="shouldShowChartDateLabel(i, displayMaxReps.length, isNarrow)"
              class="chart-label"
              :x="chartX(i, displayMaxReps.length)"
              y="148"
              text-anchor="middle"
            >
              {{ chartDateLabel(p.date) }}
            </text>
            <text
              v-if="shouldShowChartValueLabel(i, displayMaxRepsValues, maxChartMax, isNarrow)"
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
      <h4 class="sec-head">
        <IconActivity :size="18" class="sec-icon" />
        {{ t('stats.weeklyVolume') }}
      </h4>
      <p v-if="weeklyBars.length === 0" class="sub chart-empty">{{ t('stats.chartEmpty') }}</p>
      <div v-else class="chart-wrap">
        <svg class="chart" viewBox="0 0 372 148" role="img" :aria-label="t('stats.weeklyVolume')">
          <title>{{ t('stats.weeklyVolume') }}</title>
          <text class="chart-tick" :x="CHART_TICK_X" :y="CHART_Y_BASE + 4" text-anchor="end">0</text>
          <text
            class="chart-tick"
            :x="CHART_TICK_X"
            :y="chartY(weeklyChartMax, weeklyChartMax) + 4"
            text-anchor="end"
          >
            {{ weeklyChartMax }}
          </text>
          <line
            :x1="CHART_X_START"
            :y1="CHART_Y_BASE"
            :x2="CHART_X_END"
            :y2="CHART_Y_BASE"
            stroke="var(--line)"
            stroke-width="2"
          />
          <line
            v-for="i in 4"
            :key="`vgrid-${i}`"
            :x1="CHART_X_START"
            :y1="CHART_Y_BASE - i * 25"
            :x2="CHART_X_END"
            :y2="CHART_Y_BASE - i * 25"
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
              :height="CHART_Y_BASE - chartY(b.vol, weeklyChartMax)"
              fill="var(--accent)"
            />
            <text
              v-if="shouldShowChartDateLabel(i, displayWeeklyBars.length, isNarrow)"
              class="chart-label"
              :x="chartX(i, displayWeeklyBars.length)"
              y="144"
              text-anchor="middle"
            >
              {{ chartDateLabel(b.week) }}
            </text>
            <text
              v-if="shouldShowWeeklyValueLabel(i, displayWeeklyValues, weeklyChartMax, isNarrow)"
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
    <section class="sec">
      <h4>{{ t('stats.history') }}</h4>
      <label v-if="historyMonths.length > 1" class="filter-label">
        <span>{{ t('stats.filterMonth') }}</span>
        <select v-model="historyMonthFilter" class="month-filter">
          <option value="">{{ t('stats.filterAll') }}</option>
          <option v-for="m in historyMonths" :key="m" :value="m">
            {{ formatMonthLabel(m, locale) }}
          </option>
        </select>
      </label>
      <p v-if="history.length === 0" class="sub hist-empty">{{ t('stats.historyEmpty') }}</p>
      <ul v-else class="hist">
        <li v-for="r in history" :key="r.id ?? r.startedAt">
          <div class="date">
            <b>{{ formatShortDate(r.date, locale) }}</b>
            <span v-if="r.kind === 'test'">{{ t('onboarding.testTitle') }}</span>
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
      <button type="button" class="btn accent" @click="exportHistoryJson">
        <AppIcon name="download" />
        {{ t('stats.export') }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.kpis {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}
.kpi {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: var(--card);
  border: 2px solid var(--line);
  border-radius: 2px;
  box-shadow: 4px 4px 0 var(--shadow);
  padding: 12px 14px;
}
.kpi b {
  flex: 0 0 auto;
  min-width: 2.2ch;
  text-align: right;
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 2rem;
  line-height: 1;
}
.kpi-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font: 700 0.7rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.kpi-icon {
  flex-shrink: 0;
  color: var(--accent-text);
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
  min-width: 256px;
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
.hist li:last-child {
  border-bottom: 0;
}
.hist li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 2px solid var(--line);
}
.hist .date {
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
  min-width: 0;
  overflow: hidden;
}
.hist .info b {
  display: block;
  font: 800 0.85rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pill {
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 4px 8px;
  border: 2px solid var(--line);
  text-transform: uppercase;
  flex-shrink: 0;
  white-space: nowrap;
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
.hist-empty {
  margin: 12px 0 4px;
}
.filter-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.month-filter {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 28px 0 12px;
  border: 2px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font: 700 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-align: right;
  text-align-last: right;
}
.level-info {
  margin: 6px 0 0;
  font: 700 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.sec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
}
.sec-icon {
  flex-shrink: 0;
  color: var(--accent-text);
}
</style>
