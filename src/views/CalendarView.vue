<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import { useProgressStore } from '@/stores/progress'
import { rescheduleWorkout, autoskipMissed, getRescheduleOptions } from '@/domain/schedule'
import { formatLocalDate, todayLocal } from '@/utils/dates'

const { t } = useI18n()
const router = useRouter()
const progressStore = useProgressStore()

const viewMonth = ref(new Date())
const selectedIndex = ref<number | null>(null)
const selectedMoveDate = ref<string | null>(null)

const today = todayLocal()

const monthLabel = computed(() =>
  viewMonth.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
)

const completedDates = computed(
  () => new Set(progressStore.records.filter((r) => r.kind === 'workout' && r.result === 'success').map((r) => r.date)),
)

const schedule = computed(() => progressStore.progress?.schedule ?? [])

const calendarDays = computed(() => {
  const y = viewMonth.value.getFullYear()
  const m = viewMonth.value.getMonth()
  const first = new Date(y, m, 1)
  const startPad = (first.getDay() + 6) % 7
  const days: { date: string; day: number; inMonth: boolean }[] = []
  const start = new Date(y, m, 1 - startPad)
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      date: formatLocalDate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === m,
    })
  }
  return days
})

function dayStatus(date: string) {
  if (completedDates.value.has(date)) return 'done'
  const slotIdx = schedule.value.findIndex((s) => s.date === date)
  if (slotIdx >= 0) {
    if (date < today && !completedDates.value.has(date)) return 'missed'
    return 'planned'
  }
  if (date === today) return 'today'
  return 'rest'
}

function selectDay(date: string) {
  const idx = schedule.value.findIndex((s) => s.date === date)
  if (idx >= 0) {
    selectedIndex.value = idx
    selectedMoveDate.value = date
  }
}

const moveOptions = computed(() =>
  selectedIndex.value !== null ? getRescheduleOptions(schedule.value, selectedIndex.value) : [],
)

function prevMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1)
}

function goToday() {
  viewMonth.value = new Date()
}

async function applyMove() {
  if (selectedIndex.value === null || !selectedMoveDate.value || !progressStore.progress) return
  const moved = rescheduleWorkout(schedule.value, selectedIndex.value, selectedMoveDate.value)
  if (!moved) return
  await progressStore.updateProgress({ ...progressStore.progress, schedule: moved })
  selectedIndex.value = null
}

async function handleMissedAutoshift() {
  const p = progressStore.progress
  if (!p) return
  const missedIdx = schedule.value.findIndex((s) => s.date < today && !completedDates.value.has(s.date))
  if (missedIdx < 0) return
  const shifted = autoskipMissed(schedule.value, missedIdx, today)
  await progressStore.updateProgress({ ...p, schedule: shifted })
}

handleMissedAutoshift()
</script>

<template>
  <div class="calendar-wrap">
    <div class="calhead">
      <h3>{{ monthLabel }}</h3>
      <div class="nav">
        <button type="button" class="iconbtn" @click="prevMonth">‹</button>
        <button type="button" class="iconbtn" @click="nextMonth">›</button>
        <button type="button" class="today" @click="goToday">{{ t('common.today') }}</button>
      </div>
    </div>
    <div class="calgrid">
      <div v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="d" class="dow">{{ d }}</div>
      <button
        v-for="cell in calendarDays"
        :key="cell.date"
        type="button"
        class="day"
        :class="[dayStatus(cell.date), { out: !cell.inMonth, sel: selectedMoveDate === cell.date }]"
        @click="selectDay(cell.date)"
      >
        {{ cell.day }}
      </button>
    </div>
    <div class="legend">
      <span>{{ t('calendar.done') }}</span>
      <span>{{ t('calendar.missed') }}</span>
      <span>{{ t('calendar.planned') }}</span>
    </div>
    <div v-if="selectedIndex !== null" class="sheetcard panel">
      <h4>{{ schedule[selectedIndex]?.date }}</h4>
      <div class="optrow">
        <button
          v-for="opt in moveOptions"
          :key="opt"
          type="button"
          class="opt"
          :class="{ on: selectedMoveDate === opt }"
          @click="selectedMoveDate = opt"
        >
          {{ opt }}
        </button>
      </div>
      <p class="sub">{{ t('calendar.shiftNote') }}</p>
      <div class="btnrow">
        <button type="button" class="btn accent" @click="applyMove">{{ t('common.move') }}</button>
        <button type="button" class="btn ghost" @click="router.push('/workout')">{{ t('calendar.startNow') }}</button>
      </div>
    </div>
    <AppTabBar />
  </div>
</template>

<style scoped>
.calhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 14px;
}
.calhead h3 {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.25rem;
  margin: 0;
  text-transform: uppercase;
}
.nav {
  display: flex;
  gap: 7px;
}
.today {
  min-height: 44px;
  padding: 0 13px;
  background: var(--card);
  border: 2px solid var(--line);
  box-shadow: 3px 3px 0 var(--shadow);
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.calgrid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.dow {
  text-align: center;
  font: 700 0.58rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.day {
  min-height: 44px;
  background: var(--card);
  border: 2px solid var(--line);
  box-shadow: 2px 2px 0 var(--shadow);
  font: 800 0.95rem/1 'Arial Black', system-ui, sans-serif;
  cursor: pointer;
}
.day.out {
  opacity: 0.35;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.day.done {
  border-color: var(--ok);
}
.day.missed {
  border-color: var(--muted);
  color: var(--muted);
}
.day.planned::after {
  content: '';
  width: 5px;
  height: 5px;
  background: var(--accent2);
  position: absolute;
  bottom: 5px;
}
.day.today {
  background: var(--accent);
  color: var(--accent-ink);
}
.day.sel {
  outline: 3px solid var(--accent2);
}
.legend {
  display: flex;
  gap: 14px;
  justify-content: center;
  padding: 12px 0;
  font: 700 0.64rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.optrow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0;
}
.opt {
  min-height: 46px;
  padding: 0 10px;
  border: 2px solid var(--line);
  background: var(--card);
  font: 800 0.74rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.opt.on {
  background: var(--accent);
  color: var(--accent-ink);
}
</style>
