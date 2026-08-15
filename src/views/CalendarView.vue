<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import { useModalA11y } from '@/composables/use-modal-a11y'
import { useProgressStore } from '@/stores/progress'
import { rescheduleWorkout, autoskipMissed, getRescheduleOptions } from '@/domain/schedule'
import { formatDisplayDate, formatLocalDate, todayLocal } from '@/utils/dates'

const { t, locale } = useI18n()
const router = useRouter()
const progressStore = useProgressStore()

const viewMonth = ref(new Date())
const selectedIndex = ref<number | null>(null)
const selectedMoveDate = ref<string | null>(null)
const autoshiftBanner = ref(false)
const showStartConfirm = ref(false)
const dayHint = ref('')
let dayHintTimer: ReturnType<typeof setTimeout> | null = null

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

function isToday(date: string) {
  return date === today
}

const sheetOpen = computed(() => selectedIndex.value !== null)

const { panelRef: sheetDialogRef } = useModalA11y(sheetOpen, {
  onEscape: () => dismissSheet(),
})

function dismissSheet() {
  selectedIndex.value = null
  selectedMoveDate.value = null
}

function showDayHint(message: string) {
  dayHint.value = message
  if (dayHintTimer) clearTimeout(dayHintTimer)
  dayHintTimer = setTimeout(() => {
    dayHint.value = ''
    dayHintTimer = null
  }, 2800)
}

async function selectDay(date: string) {
  const idx = schedule.value.findIndex((s) => s.date === date)
  if (idx >= 0) {
    selectedIndex.value = idx
    selectedMoveDate.value = date
    dayHint.value = ''
    await nextTick()
    sheetDialogRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } else {
    dismissSheet()
    showDayHint(t('calendar.notScheduled'))
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

const startTargetDate = computed(() => selectedMoveDate.value ?? selectedSlot.value?.date ?? null)

const isFutureStart = computed(() => {
  const date = startTargetDate.value
  return date ? date > today : false
})

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

const moveUnchanged = computed(() => {
  if (!selectedSlot.value || !selectedMoveDate.value) return false
  return selectedMoveDate.value === selectedSlot.value.date
})

async function applyMove() {
  if (selectedIndex.value === null || !selectedMoveDate.value || !progressStore.progress) return
  if (moveUnchanged.value) {
    showDayHint(t('calendar.moveUnchanged'))
    return
  }
  const moved = rescheduleWorkout(schedule.value, selectedIndex.value, selectedMoveDate.value)
  if (!moved) return
  await progressStore.updateProgress({ ...progressStore.progress, schedule: moved })
  dismissSheet()
}

function startSelected() {
  if (isFutureStart.value) {
    showStartConfirm.value = true
    return
  }
  goStartWorkout()
}

function goStartWorkout() {
  showStartConfirm.value = false
  const date = startTargetDate.value
  router.push(date ? `/workout/${date}` : '/workout')
}

function repeatMissed() {
  if (selectedSlot.value) router.push(`/workout/${selectedSlot.value.date}`)
}

function goToday() {
  viewMonth.value = new Date()
}

const AUTOSHIFT_SESSION_KEY = 'pullup-trainer-autoshift-shown'

async function handleMissedAutoshift() {
  if (sessionStorage.getItem(AUTOSHIFT_SESSION_KEY)) return
  const p = progressStore.progress
  if (!p) return
  const missedIdx = schedule.value.findIndex((s) => s.date < today && !completedDates.value.has(s.date))
  if (missedIdx < 0) return
  const shifted = autoskipMissed(schedule.value, missedIdx, today)
  await progressStore.updateProgress({ ...p, schedule: shifted })
  autoshiftBanner.value = true
  sessionStorage.setItem(AUTOSHIFT_SESSION_KEY, '1')
}

onMounted(() => {
  void handleMissedAutoshift()
})

onBeforeUnmount(() => {
  if (dayHintTimer) clearTimeout(dayHintTimer)
})
</script>

<template>
  <div class="calendar-wrap">
    <header class="head">
      <div>
        <p class="kicker">{{ t('calendar.title') }}</p>
        <h1>{{ monthLabel }}</h1>
      </div>
      <div class="nav">
        <button type="button" class="iconbtn" :aria-label="t('calendar.prevMonth')" @click="prevMonth">‹</button>
        <button type="button" class="iconbtn" :aria-label="t('calendar.nextMonth')" @click="nextMonth">›</button>
        <button type="button" class="today" @click="goToday">{{ t('common.today') }}</button>
      </div>
    </header>
    <div v-if="autoshiftBanner" class="banner">{{ t('calendar.autoshiftApplied') }}</div>
    <p v-if="dayHint" class="day-hint" role="status" aria-live="polite">{{ dayHint }}</p>
    <div class="calgrid">
      <div v-for="d in dowKeys" :key="d" class="dow">{{ t(`calendar.dow.${d}`) }}</div>
      <button
        v-for="cell in calendarDays"
        :key="cell.date"
        type="button"
        class="day"
        :class="[
          dayStatus(cell.date),
          { out: !cell.inMonth, sel: selectedMoveDate === cell.date, today: isToday(cell.date) },
        ]"
        :aria-label="dayAriaLabel(cell.date, cell.day)"
        @click="selectDay(cell.date)"
      >
        {{ cell.day }}
      </button>
    </div>
    <div class="legend">
      <span><i class="dot done" aria-hidden="true" />{{ t('calendar.done') }}</span>
      <span><i class="dot missed" aria-hidden="true" />{{ t('calendar.missed') }}</span>
      <span><i class="dot planned" aria-hidden="true" />{{ t('calendar.planned') }}</span>
      <span><i class="dot today" aria-hidden="true" />{{ t('calendar.todayLegend') }}</span>
    </div>
    <Teleport to="body">
      <div
        v-if="selectedIndex !== null"
        class="sheet-backdrop"
        role="presentation"
        @click.self="dismissSheet"
      >
        <div
          ref="sheetDialogRef"
          class="sheetcard panel"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          :aria-labelledby="'calendar-sheet-title'"
          :aria-describedby="'calendar-sheet-desc'"
        >
          <div class="sheet-head">
            <h4 id="calendar-sheet-title">{{ formatDisplayDate(selectedSlot?.date ?? '', locale) }}</h4>
            <button type="button" class="sheet-close" @click="dismissSheet">{{ t('calendar.closeSheet') }}</button>
          </div>
          <div class="optrow">
            <button
              v-for="opt in moveOptions"
              :key="opt"
              type="button"
              class="opt"
              :class="{ on: selectedMoveDate === opt }"
              :aria-pressed="selectedMoveDate === opt"
              @click="selectedMoveDate = opt"
            >
              {{ formatDisplayDate(opt, locale) }}
            </button>
          </div>
          <p id="calendar-sheet-desc" class="sub">{{ t('calendar.shiftNote') }}</p>
          <div class="btnrow">
            <button
              type="button"
              class="btn accent"
              :disabled="moveUnchanged"
              @click="applyMove"
            >
              {{ t('common.move') }}
            </button>
            <button type="button" class="btn ghost" @click="startSelected">{{ t('calendar.startNow') }}</button>
            <button v-if="isMissedSelected" type="button" class="btn ghost" @click="repeatMissed">
              {{ t('calendar.repeatMissed') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <ConfirmPanel
      :visible="showStartConfirm"
      :title="t('common.earlyStartTitle')"
      :message="t('common.earlyStartConfirm')"
      @confirm="goStartWorkout"
      @cancel="showStartConfirm = false"
    />
  </div>
</template>

<style scoped>
.head {
  align-items: flex-start;
}
.head h1 {
  font-size: clamp(1.2rem, 5vw, 1.5rem);
}
.banner {
  background: var(--card);
  border: 2px solid var(--line);
  padding: 10px 12px;
  margin-bottom: 12px;
  font: 700 0.72rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.day-hint {
  margin: 0 0 12px;
  padding: 10px 12px;
  background: var(--card);
  border: 2px solid var(--line);
  font: 700 0.72rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
  text-align: center;
}
.nav {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  justify-content: flex-end;
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
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
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
.day.planned.today::after {
  background: var(--accent-ink);
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
  font: 700 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border: 2px solid var(--line);
  flex-shrink: 0;
}
.dot.done {
  border-color: var(--ok);
}
.dot.missed {
  border-color: var(--muted);
  background: var(--bg2);
}
.dot.planned {
  background: var(--accent2);
  border-color: var(--accent2);
}
.dot.today {
  background: var(--accent);
  border-color: var(--accent);
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
.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.sheet-head h4 {
  font-family: 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  margin: 0;
}
.sheet-close {
  appearance: none;
  cursor: pointer;
  min-height: 44px;
  padding: 0 10px;
  border: 2px solid var(--line);
  background: var(--bg);
  font: 800 0.62rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--muted);
  flex-shrink: 0;
}
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: color-mix(in srgb, var(--ink) 45%, transparent);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 18px calc(8px + env(safe-area-inset-bottom, 0px));
}
.sheet-backdrop .sheetcard {
  width: 100%;
  max-width: 480px;
  max-height: 70dvh;
  overflow-y: auto;
}
@media (max-width: 420px) {
  .sheet-backdrop .btnrow {
    flex-direction: column;
  }
  .sheet-backdrop .btnrow .btn {
    width: 100%;
  }
}
</style>
