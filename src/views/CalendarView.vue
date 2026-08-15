<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import { useProgressStore } from '@/stores/progress'
import { rescheduleWorkout, autoskipMissed, getRescheduleOptions } from '@/domain/schedule'
import { formatDisplayDate, formatLocalDate, todayLocal } from '@/utils/dates'

const { t, locale } = useI18n()
const router = useRouter()
const progressStore = useProgressStore()

const viewMonth = ref(new Date())
const selectedIndex = ref<number | null>(null)
const selectedMoveDate = ref<string | null>(null)

const today = todayLocal()
const dowKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const monthLabel = computed(() =>
  viewMonth.value.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }),
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

const selectedSlot = computed(() =>
  selectedIndex.value !== null ? schedule.value[selectedIndex.value] : null,
)

const isMissedSelected = computed(() => {
  if (!selectedSlot.value) return false
  return selectedSlot.value.date < today && !completedDates.value.has(selectedSlot.value.date)
})

const moveOptions = computed(() =>
  selectedIndex.value !== null ? getRescheduleOptions(schedule.value, selectedIndex.value) : [],
)

function prevMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1)
}

function dayAriaLabel(date: string, day: number) {
  const status = dayStatus(date)
  const statusKey =
    status === 'done'
      ? 'calendar.done'
      : status === 'missed'
        ? 'calendar.missed'
        : status === 'planned'
          ? 'calendar.planned'
          : status === 'today'
            ? 'calendar.todayLegend'
            : ''
  const statusText = statusKey ? t(statusKey) : ''
  return statusText ? `${day}, ${statusText}` : String(day)
}

async function applyMove() {
  if (selectedIndex.value === null || !selectedMoveDate.value || !progressStore.progress) return
  const moved = rescheduleWorkout(schedule.value, selectedIndex.value, selectedMoveDate.value)
  if (!moved) return
  await progressStore.updateProgress({ ...progressStore.progress, schedule: moved })
  selectedIndex.value = null
}

function startSelected() {
  const date = selectedMoveDate.value ?? selectedSlot.value?.date
  router.push(date ? `/workout/${date}` : '/workout')
}

function repeatMissed() {
  if (selectedSlot.value) router.push(`/workout/${selectedSlot.value.date}`)
}

function goToday() {
  viewMonth.value = new Date()
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
        <button type="button" class="iconbtn" :aria-label="t('calendar.prevMonth')" @click="prevMonth">‹</button>
        <button type="button" class="iconbtn" :aria-label="t('calendar.nextMonth')" @click="nextMonth">›</button>
        <button type="button" class="today" @click="goToday">{{ t('common.today') }}</button>
      </div>
    </div>
    <div class="calgrid">
      <div v-for="d in dowKeys" :key="d" class="dow">{{ t(`calendar.dow.${d}`) }}</div>
      <button
        v-for="cell in calendarDays"
        :key="cell.date"
        type="button"
        class="day"
        :class="[dayStatus(cell.date), { out: !cell.inMonth, sel: selectedMoveDate === cell.date }]"
        :aria-label="dayAriaLabel(cell.date, cell.day)"
        @click="selectDay(cell.date)"
      >
        {{ cell.day }}
      </button>
    </div>
    <div class="legend">
      <span>{{ t('calendar.done') }}</span>
      <span>{{ t('calendar.missed') }}</span>
      <span>{{ t('calendar.planned') }}</span>
      <span>{{ t('calendar.todayLegend') }}</span>
    </div>
    <div v-if="selectedIndex !== null" class="sheetcard panel">
      <h4>{{ formatDisplayDate(selectedSlot?.date ?? '', locale) }}</h4>
      <div class="optrow">
        <button
          v-for="opt in moveOptions"
          :key="opt"
          type="button"
          class="opt"
          :class="{ on: selectedMoveDate === opt }"
          @click="selectedMoveDate = opt"
        >
          {{ formatDisplayDate(opt, locale) }}
        </button>
      </div>
      <p class="sub">{{ t('calendar.shiftNote') }}</p>
      <div class="btnrow">
        <button type="button" class="btn accent" @click="applyMove">{{ t('common.move') }}</button>
        <button type="button" class="btn ghost" @click="startSelected">{{ t('calendar.startNow') }}</button>
        <button v-if="isMissedSelected" type="button" class="btn ghost" @click="repeatMissed">
          {{ t('calendar.repeatMissed') }}
        </button>
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
  cursor: pointer;
  color: var(--ink);
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
  position: relative;
  min-height: 44px;
  background: var(--card);
  border: 2px solid var(--line);
  box-shadow: 2px 2px 0 var(--shadow);
  font: 800 0.95rem/1 'Arial Black', system-ui, sans-serif;
  cursor: pointer;
  color: var(--ink);
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
  background: var(--bg2);
}
.day.planned::after {
  content: '';
  width: 5px;
  height: 5px;
  background: var(--accent2);
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
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
  flex-wrap: wrap;
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
  cursor: pointer;
  color: var(--ink);
}
.opt.on {
  background: var(--accent);
  color: var(--accent-ink);
}
.sheetcard {
  position: relative;
}
.sheetcard::before {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  background: var(--muted);
  margin: 0 auto 12px;
  border-radius: 2px;
}
.sheetcard h4 {
  font-family: 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  margin: 0 0 8px;
}
</style>
