<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { useModalA11y } from '@/composables/use-modal-a11y'
import { useProgressStore } from '@/stores/progress'
import { useWorkoutSessionStore } from '@/stores/workout-session'
import { rescheduleWorkout, getRescheduleOptions, canStartEarly } from '@/domain/schedule'
import { formatDisplayDate, formatLocalDate, todayLocal } from '@/utils/dates'

const { t, locale } = useI18n()
const router = useRouter()
const progressStore = useProgressStore()
const workoutStore = useWorkoutSessionStore()

const viewMonth = ref(new Date())
const selectedDate = ref<string | null>(null)
const selectedIndex = ref<number | null>(null)
const selectedMoveDate = ref<string | null>(null)
const showStartConfirm = ref(false)
const dayHint = ref('')
let dayHintTimer: ReturnType<typeof setTimeout> | null = null

const today = computed(() => todayLocal())
const dowKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const monthLabel = computed(() =>
  viewMonth.value.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

const successDates = computed(
  () => new Set(progressStore.records.filter((r) => r.kind === 'workout' && r.result === 'success').map((r) => r.date)),
)

const attemptedDates = computed(
  () => new Set(progressStore.records.filter((r) => r.kind === 'workout').map((r) => r.date)),
)

const failedDates = computed(
  () => new Set(progressStore.records.filter((r) => r.kind === 'workout' && r.result === 'fail').map((r) => r.date)),
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
  if (successDates.value.has(date)) return 'done'
  if (failedDates.value.has(date)) return 'failed'
  const slotIdx = schedule.value.findIndex((s) => s.date === date)
  if (slotIdx >= 0) return 'planned'
  if (date === today.value) return 'today'
  return 'rest'
}

function isToday(date: string) {
  return date === today.value
}

const sheetOpen = computed(() => selectedDate.value !== null)

const isReadOnlySheet = computed(
  () => selectedDate.value !== null && attemptedDates.value.has(selectedDate.value),
)

const { panelRef: sheetDialogRef } = useModalA11y(sheetOpen, {
  onEscape: () => dismissSheet(),
})

function dismissSheet() {
  selectedDate.value = null
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
  if (attemptedDates.value.has(date)) {
    selectedDate.value = date
    selectedIndex.value = null
    selectedMoveDate.value = null
    dayHint.value = ''
    await nextTick()
    sheetDialogRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    return
  }

  const idx = schedule.value.findIndex((s) => s.date === date)
  if (idx >= 0) {
    selectedDate.value = date
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

const dayRecords = computed(() => {
  const date = selectedDate.value
  if (!date) return []
  return progressStore.records.filter((r) => r.date === date)
})

function recordSummary(r: (typeof progressStore.records)[0]) {
  if (r.kind === 'test') return `${r.sets[0]?.done ?? 0} ${t('workout.reps')}`
  return r.sets.map((s) => s.done).join('·') || '—'
}

const nextSlot = computed(() => progressStore.getNextSlot())

const isNextSlotSelected = computed(() => {
  const slot = selectedSlot.value
  const next = nextSlot.value
  return !!slot && !!next && slot.date === next.date
})

const moveOptions = computed(() => {
  const p = progressStore.progress
  if (selectedIndex.value === null || !p) return []
  return getRescheduleOptions(
    schedule.value,
    selectedIndex.value,
    today.value,
    p.lastWorkoutDate,
  )
})

const canStartSelectedNow = computed(() => {
  const p = progressStore.progress
  const slot = selectedSlot.value
  if (!p || !slot || !isNextSlotSelected.value) return false
  if (slot.date === today.value) return true
  const idx = p.schedule.findIndex((s) => s.date === slot.date)
  if (idx < 0) return false
  return canStartEarly(p.schedule, idx, today.value, p.lastWorkoutDate)
})

const needsEarlyStartConfirm = computed(() => {
  const slot = selectedSlot.value
  return !!slot && slot.date > today.value && canStartSelectedNow.value
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
        : status === 'failed'
          ? 'calendar.failed'
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

const moveBlocked = computed(() => {
  const slot = selectedSlot.value
  const active = workoutStore.active
  if (!slot || !active) return false
  return active.date === slot.date && !workoutStore.isComplete()
})

async function applyMove() {
  if (moveBlocked.value) return
  if (selectedIndex.value === null || !selectedMoveDate.value || !progressStore.progress) return
  if (moveUnchanged.value) {
    showDayHint(t('calendar.moveUnchanged'))
    return
  }
  const moved = rescheduleWorkout(
    schedule.value,
    selectedIndex.value,
    selectedMoveDate.value,
    today.value,
    progressStore.progress.lastWorkoutDate,
  )
  if (!moved) return
  await progressStore.updateProgress({ ...progressStore.progress, schedule: moved })
  dismissSheet()
}

function startSelected() {
  if (!canStartSelectedNow.value) return
  if (needsEarlyStartConfirm.value) {
    showStartConfirm.value = true
    return
  }
  goStartWorkout()
}

async function goStartWorkout() {
  showStartConfirm.value = false
  const slot = selectedSlot.value
  if (!slot || !canStartSelectedNow.value) return
  if (slot.date > today.value) {
    const ok = await progressStore.applyEarlyStartReschedule()
    if (!ok) return
  }
  router.push(`/workout/${today.value}`)
}

function goToday() {
  viewMonth.value = new Date()
}

onBeforeUnmount(() => {
  if (dayHintTimer) clearTimeout(dayHintTimer)
})
</script>

<template>
  <div class="calendar-wrap page">
    <header class="head">
      <div>
        <p class="kicker">{{ t('calendar.title') }}</p>
        <h1>{{ monthLabel }}</h1>
      </div>
      <div class="nav">
        <button type="button" class="iconbtn" :aria-label="t('calendar.prevMonth')" @click="prevMonth">
          <AppIcon name="chev-left" />
        </button>
        <button type="button" class="iconbtn" :aria-label="t('calendar.nextMonth')" @click="nextMonth">
          <AppIcon name="chev-right" />
        </button>
        <button type="button" class="today-btn" @click="goToday">{{ t('common.today') }}</button>
      </div>
    </header>
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
          { out: !cell.inMonth, sel: selectedDate === cell.date, today: isToday(cell.date) },
        ]"
        :aria-label="dayAriaLabel(cell.date, cell.day)"
        @click="selectDay(cell.date)"
      >
        {{ cell.day }}
        <span v-if="dayStatus(cell.date) === 'done'" class="day-icon"><AppIcon name="check" /></span>
        <span v-else-if="dayStatus(cell.date) === 'failed'" class="day-icon"><AppIcon name="x" /></span>
      </button>
    </div>
    <div class="legend page-bottom">
      <span><i class="dot done" aria-hidden="true" />{{ t('calendar.done') }}</span>
      <span><i class="dot failed" aria-hidden="true" />{{ t('calendar.failed') }}</span>
      <span><i class="dot planned" aria-hidden="true" />{{ t('calendar.planned') }}</span>
      <span><i class="dot today" aria-hidden="true" />{{ t('calendar.todayLegend') }}</span>
    </div>
    <Teleport to="body">
      <div
        v-if="selectedDate !== null"
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
          :aria-describedby="isReadOnlySheet ? 'calendar-sheet-locked' : 'calendar-sheet-desc'"
        >
          <div class="sheet-head">
            <h4 id="calendar-sheet-title">{{ formatDisplayDate(selectedDate ?? '', locale) }}</h4>
            <button
              type="button"
              class="iconbtn sheet-close"
              :aria-label="t('calendar.closeSheet')"
              @click="dismissSheet"
            >
              <AppIcon name="x" />
            </button>
          </div>
          <template v-if="isReadOnlySheet">
            <p id="calendar-sheet-locked" class="shift-note">
              <AppIcon name="info" />
              {{ t('calendar.attemptedLocked') }}
            </p>
            <div v-if="dayRecords.length" class="day-history">
              <p class="day-history-title">{{ t('calendar.dayHistory') }}</p>
              <ul>
                <li v-for="r in dayRecords" :key="r.id ?? r.startedAt">
                  <span>{{ r.kind === 'test' ? t('onboarding.testTitle') : r.programName }}</span>
                  <b>{{ recordSummary(r) }}</b>
                  <span class="pill" :class="r.result === 'success' ? 'ok' : 'part'">{{
                    r.result === 'success' ? t('stats.success') : t('stats.partial')
                  }}</span>
                </li>
              </ul>
            </div>
            <p v-else class="day-history-empty">{{ t('calendar.dayHistoryEmpty') }}</p>
          </template>
          <template v-else>
            <div v-if="!moveBlocked" class="optrow">
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
            <p v-else id="calendar-sheet-desc" class="shift-note move-blocked">
              <AppIcon name="info" />
              {{ t('calendar.moveBlockedActive') }}
            </p>
            <p v-if="!moveBlocked" id="calendar-sheet-desc" class="shift-note">
              <AppIcon name="info" />
              {{ t('calendar.shiftNote') }}
            </p>
            <div v-if="dayRecords.length" class="day-history">
              <p class="day-history-title">{{ t('calendar.dayHistory') }}</p>
              <ul>
                <li v-for="r in dayRecords" :key="r.id ?? r.startedAt">
                  <span>{{ r.kind === 'test' ? t('onboarding.testTitle') : r.programName }}</span>
                  <b>{{ recordSummary(r) }}</b>
                  <span class="pill" :class="r.result === 'success' ? 'ok' : 'part'">{{
                    r.result === 'success' ? t('stats.success') : t('stats.partial')
                  }}</span>
                </li>
              </ul>
            </div>
            <p v-else class="day-history-empty">{{ t('calendar.dayHistoryEmpty') }}</p>
            <div class="btnrow">
              <button
                v-if="!moveBlocked"
                type="button"
                class="btn accent"
                :disabled="moveUnchanged"
                @click="applyMove"
              >
                {{ t('common.move') }}
              </button>
              <button
                v-if="canStartSelectedNow"
                type="button"
                class="btn ghost"
                @click="startSelected"
              >
                {{ t('calendar.startNow') }}
              </button>
            </div>
          </template>
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
  flex-wrap: nowrap;
  align-items: flex-start;
}
.head > div:first-child {
  flex: 1;
  min-width: 0;
}
.head h1 {
  font-size: clamp(1.2rem, 5vw, 1.5rem);
  overflow-wrap: anywhere;
}
.banner {
  background: var(--card);
  border: 2px solid var(--line);
  padding: 10px 12px;
  margin-bottom: 12px;
  font: 700 0.72rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.pending-banner p {
  margin: 0 0 10px;
}
.banner-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.banner-actions .btn {
  flex: 1;
  min-width: 120px;
  margin-top: 0;
}
.day-history {
  margin: 0 0 14px;
  padding-top: 8px;
  border-top: 2px solid var(--line);
}
.day-history-title {
  margin: 0 0 8px;
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--muted);
}
.day-history ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.day-history li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  font: 700 0.72rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
}
.day-history li b {
  flex: 1;
  text-align: right;
}
.day-history .pill {
  font: 800 0.65rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 3px 6px;
  border: 2px solid var(--line);
  text-transform: uppercase;
}
.day-history .pill.ok {
  color: var(--ok);
}
.day-history .pill.part {
  color: var(--warn);
}
.day-history-empty {
  margin: 0 0 14px;
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
  flex-wrap: nowrap;
  flex-shrink: 0;
  justify-content: flex-end;
}
.today-btn {
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
.day.failed {
  border-color: var(--warn);
  color: var(--ink);
  background: var(--card);
}
.day.missed {
  border-color: var(--muted);
  color: var(--muted);
  background: var(--bg2);
}
.day .day-icon {
  position: absolute;
  top: 3px;
  right: 3px;
}
.day.done .day-icon {
  color: var(--ok);
}
.day.failed .day-icon {
  color: var(--warn);
}
.day.missed .day-icon {
  color: var(--muted);
}
.shift-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 14px;
  font: 700 0.72rem/1.35 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
}
.shift-note svg {
  flex: 0 0 auto;
  width: 13px;
  height: 13px;
  margin-top: 2px;
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
  border-color: var(--line);
}
.day.today .day-icon {
  color: var(--accent-ink);
}
.day.planned.today::after {
  background: var(--accent-ink);
}
.day.sel {
  box-shadow:
    inset 0 0 0 3px var(--accent2),
    2px 2px 0 var(--shadow);
}
.day.out.sel {
  box-shadow: inset 0 0 0 3px var(--accent2);
}
.legend {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  padding-bottom: 12px;
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
.dot.failed {
  border-color: var(--warn);
  background: var(--card);
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
  margin-top: 8px;
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
  flex-shrink: 0;
}
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
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
