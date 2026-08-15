<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import { useProgressStore } from '@/stores/progress'
import { useSettingsStore } from '@/stores/settings'
import { exportHistory } from '@/domain/export'
import { downloadJson } from '@/utils/platform'
import { computeWeeklyStreak } from '@/utils/streak'
import { formatDisplayDate, startOfWeek, todayLocal } from '@/utils/dates'

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

const history = computed(() => progressStore.records.slice(0, 10))

function recordLabel(r: (typeof progressStore.records)[0]) {
  if (r.kind === 'test') return `${r.sets[0]?.done ?? 0} ${t('workout.reps')}`
  const sets = r.sets.map((s) => s.done).join('·')
  return sets || r.result
}

function exportHistoryJson() {
  const lang = settingsStore.settings?.language ?? 'en'
  const data = exportHistory(progressStore.records, '1.0.0', lang)
  downloadJson('pullup-trainer-history.json', data)
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <p class="kicker">{{ t('stats.kicker') }}</p>
        <h2>{{ t('stats.title') }}</h2>
      </div>
    </header>
    <div class="kpis">
      <div class="kpi">
        <b>{{ maxReps[maxReps.length - 1]?.value ?? 0 }}</b>
        <span>{{ t('stats.maxReps') }}</span>
      </div>
      <div class="kpi">
        <b>{{ streakWeeks > 0 ? t('stats.streakWeeks', { n: streakWeeks }) : '—' }}</b>
        <span>{{ t('stats.streak') }}</span>
      </div>
      <div class="kpi">
        <b>{{ totalVolume }}</b>
        <span>{{ t('stats.volume') }}</span>
      </div>
    </div>
    <section class="sec">
      <h4>{{ t('stats.maxChart') }}</h4>
      <p class="sub">{{ t('stats.maxChartSub') }}</p>
      <svg class="chart" viewBox="0 0 354 158" role="img" :aria-label="t('stats.maxChart')">
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
          v-if="maxReps.length"
          class="line"
          :points="maxReps.map((p, i) => `${30 + i * 60},${130 - p.value * 8}`).join(' ')"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2.5"
        />
      </svg>
    </section>
    <section class="sec">
      <h4>{{ t('stats.weeklyVolume') }}</h4>
      <svg class="chart" viewBox="0 0 354 140" role="img" :aria-label="t('stats.weeklyVolume')">
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
        <rect
          v-for="(b, i) in weeklyBars"
          :key="b.week"
          class="bar"
          :x="30 + i * 49"
          :y="140 - Math.min(110, b.vol)"
          width="26"
          :height="Math.min(110, b.vol)"
          fill="var(--accent)"
        />
      </svg>
    </section>
    <section class="sec">
      <h4>{{ t('stats.history') }}</h4>
      <ul class="hist">
        <li v-for="r in history" :key="r.id ?? r.startedAt">
          <div class="date">
            <b>{{ formatDisplayDate(r.date, locale).slice(0, 6) }}</b>
            <span>{{ r.kind === 'test' ? t('onboarding.testTitle') : r.programName }}</span>
          </div>
          <div class="info"><b>{{ recordLabel(r) }}</b></div>
          <span class="pill" :class="r.result === 'success' ? 'ok' : 'part'">{{
            r.result === 'success' ? t('stats.success') : t('stats.partial')
          }}</span>
        </li>
      </ul>
      <button type="button" class="btn accent" @click="exportHistoryJson">{{ t('stats.export') }}</button>
    </section>
    <AppTabBar />
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
  padding: 12px 8px;
  text-align: center;
}
.kpi b {
  display: block;
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.7rem;
}
.kpi span {
  font: 700 0.56rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.chart {
  width: 100%;
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
.hist .date b {
  display: block;
}
.hist .date span {
  font-size: 0.72rem;
  color: var(--muted);
}
.pill {
  font: 800 0.62rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
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
</style>
