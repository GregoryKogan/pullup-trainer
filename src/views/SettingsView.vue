<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { useSettingsStore } from '@/stores/settings'
import { useProgressStore } from '@/stores/progress'
import { PALETTE_SLUGS } from '@/utils/theme'
import { exportBackup, validateBackup, normalizeImportedBackup, normalizeImportedSet, normalizeTotals, defaultSettings, type BackupExport } from '@/domain/export'
import { APP_VERSION, REST_MAX_SECONDS, REST_MIN_SECONDS, REST_PRESET_SECONDS } from '@/constants/app'
import { formatTime } from '@/utils/dates'
import { clampRestSeconds } from '@/utils/workout-display'
import { downloadJson } from '@/utils/platform'
import { requestNotificationPermission } from '@/composables/use-rest-signals'
import { db } from '@/db/database'
import type { ThemeMode, Weekday, WorkoutRecord } from '@/domain/types'

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const progressStore = useProgressStore()

const importMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const showResetConfirm = ref(false)
const showImportConfirm = ref(false)
const pendingImport = ref<BackupExport | null>(null)
const weekdayOptions: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const settings = computed(() => settingsStore.settings)

const restAtMin = computed(
  () => (settings.value?.restDurationSeconds ?? REST_MIN_SECONDS) <= REST_MIN_SECONDS,
)
const restAtMax = computed(
  () => (settings.value?.restDurationSeconds ?? REST_MAX_SECONDS) >= REST_MAX_SECONDS,
)

const scheduleProgress = computed(() => progressStore.progress)

const weekdaysAtLimit = computed(() => {
  const p = scheduleProgress.value
  return !!p && p.weekdays.length >= p.frequencyDays
})

function paletteLabel(slug: string) {
  return t(`settings.palettes.${slug}`, slug)
}

async function changeRest(delta: number) {
  const s = settings.value
  if (!s) return
  await settingsStore.update({
    restDurationSeconds: clampRestSeconds(s.restDurationSeconds + delta),
  })
}

async function setRestPreset(seconds: number) {
  await settingsStore.update({ restDurationSeconds: seconds })
}

async function toggleAutoStart() {
  const s = settings.value
  if (!s) return
  await settingsStore.update({ restAutoStart: !s.restAutoStart })
}

async function toggleNotify() {
  const s = settings.value
  if (!s) return
  const next = !s.restNotify
  await settingsStore.update({ restNotify: next })
  if (next) await requestNotificationPermission()
}

async function setMode(mode: ThemeMode) {
  await settingsStore.setThemeMode(mode)
}

async function setLang(lang: 'en' | 'ru') {
  await settingsStore.setLanguage(lang)
}

async function setPalette(slug: string) {
  await settingsStore.setPalette(slug)
}

async function setFrequency(days: 2 | 3) {
  const p = scheduleProgress.value
  if (!p) return
  let weekdays = [...p.weekdays]
  if (weekdays.length > days) {
    weekdays = weekdays.slice(0, days)
  }
  await progressStore.updateBuiltinScheduleSettings(days, weekdays)
}

function isWeekdayDisabled(day: Weekday) {
  const p = scheduleProgress.value
  if (!p) return true
  return !p.weekdays.includes(day) && p.weekdays.length >= p.frequencyDays
}

async function toggleWeekday(day: Weekday) {
  const p = scheduleProgress.value
  if (!p) return
  const set = new Set(p.weekdays)
  if (set.has(day)) {
    if (set.size <= 1) return
    set.delete(day)
  } else {
    if (set.size >= p.frequencyDays) return
    set.add(day)
  }
  await progressStore.updateBuiltinScheduleSettings(p.frequencyDays, [...set])
}

async function exportBackupFile() {
  const data = exportBackup(
    settings.value ?? defaultSettings(),
    progressStore.progress,
    progressStore.records,
    APP_VERSION,
  )
  downloadJson('pullup-trainer-backup.json', data)
}

function pickBackupFile() {
  fileInputRef.value?.click()
}

async function importBackupFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importMessage.value = ''
  try {
    const text = await file.text()
    const data = JSON.parse(text) as unknown
    if (!validateBackup(data)) {
      importMessage.value = t('settings.importError')
      return
    }
    pendingImport.value = normalizeImportedBackup(data)
    if (!pendingImport.value) {
      importMessage.value = t('settings.importError')
      return
    }
    showImportConfirm.value = true
  } catch {
    importMessage.value = t('settings.importError')
  }
  input.value = ''
}

async function confirmImport() {
  const data = pendingImport.value
  showImportConfirm.value = false
  pendingImport.value = null
  if (!data) return
  try {
    const plain = JSON.parse(JSON.stringify(toRaw(data))) as BackupExport
    const settings = { ...plain.settings, id: 'singleton' as const }
    const activeProgress = plain.activeProgress
    const history = plain.history
    await db.transaction('rw', db.settings, db.activeProgress, db.workoutRecords, async () => {
      await db.settings.put(settings)
      await db.activeProgress.put({ id: 'singleton', data: activeProgress })
      await db.workoutRecords.clear()
      for (const r of history) {
        const record: WorkoutRecord = {
          date: r.date,
          startedAt: r.startedAt,
          durationSeconds: r.durationSeconds,
          kind: r.kind,
          program: r.program,
          programName: r.programName,
          result: r.result,
          sets: r.sets.map((s) => normalizeImportedSet({ ...s, planned: s.planned ?? 0 })),
          totals: normalizeTotals(r.totals),
        }
        if (r.finishedAt) record.finishedAt = r.finishedAt
        if (r.context) record.context = r.context
        await db.workoutRecords.add(record)
      }
    })
    await settingsStore.hydrate()
    await progressStore.hydrate()
    importMessage.value = t('settings.importSuccess')
  } catch {
    importMessage.value = t('settings.importError')
  }
}

async function resetAll() {
  showResetConfirm.value = true
}

async function confirmReset() {
  showResetConfirm.value = false
  await db.delete()
  await db.open()
  await settingsStore.hydrate()
  await progressStore.hydrate()
  router.push('/onboarding')
}
</script>

<template>
  <div v-if="settings" class="page page-end-space">
    <header class="head">
      <div>
        <p class="kicker">{{ t('settings.kicker') }}</p>
        <h1>{{ t('settings.title') }}</h1>
      </div>
    </header>
    <section class="sec">
      <h4>{{ t('settings.restTimer') }}</h4>
      <div class="setrow">
        <span class="k">{{ t('settings.restDuration') }}</span>
        <span class="v rest-stepper">
          <button
            type="button"
            class="iconbtn"
            :class="{ inactive: restAtMin }"
            :aria-label="t('settings.restDecrease')"
            :disabled="restAtMin"
            @click="changeRest(-15)"
          >
            <AppIcon name="minus" />
          </button>
          <b>{{ formatTime(settings.restDurationSeconds) }}</b>
          <button
            type="button"
            class="iconbtn"
            :class="{ inactive: restAtMax }"
            :aria-label="t('settings.restIncrease')"
            :disabled="restAtMax"
            @click="changeRest(15)"
          >
            <AppIcon name="plus" />
          </button>
        </span>
      </div>
      <div class="setrow">
        <span class="k">{{ t('settings.restPresets') }}</span>
        <span class="seg">
          <button
            v-for="sec in REST_PRESET_SECONDS"
            :key="sec"
            type="button"
            :class="{ on: settings.restDurationSeconds === sec }"
            :aria-pressed="settings.restDurationSeconds === sec"
            @click="setRestPreset(sec)"
          >
            {{ formatTime(sec) }}
          </button>
        </span>
      </div>
      <div class="setrow last">
        <span class="k">{{ t('settings.autoStart') }}</span>
        <button
          type="button"
          class="sw"
          :class="{ on: settings.restAutoStart }"
          :aria-label="t('settings.autoStart')"
          :aria-pressed="settings.restAutoStart"
          @click="toggleAutoStart"
        >
          <i />
        </button>
      </div>
      <p class="sub row-hint">{{ t('settings.autoStartHint') }}</p>
      <div class="setrow last notify-row">
        <span class="k">{{ t('settings.notify') }}</span>
        <button
          type="button"
          class="sw"
          :class="{ on: settings.restNotify }"
          :aria-label="t('settings.notify')"
          :aria-pressed="settings.restNotify"
          @click="toggleNotify"
        >
          <i />
        </button>
      </div>
      <p class="sub row-hint">{{ t('settings.notifyHint') }}</p>
    </section>
    <section v-if="scheduleProgress" class="sec">
      <h4>{{ t('settings.frequency') }}</h4>
      <div class="setrow last">
        <span class="k">{{ t('settings.frequencyValue') }}</span>
        <span class="seg">
          <button
            type="button"
            :class="{ on: scheduleProgress.frequencyDays === 3 }"
            :aria-pressed="scheduleProgress.frequencyDays === 3"
            @click="setFrequency(3)"
          >
            {{ t('settings.frequency3') }}
          </button>
          <button
            type="button"
            :class="{ on: scheduleProgress.frequencyDays === 2 }"
            :aria-pressed="scheduleProgress.frequencyDays === 2"
            @click="setFrequency(2)"
          >
            {{ t('settings.frequency2') }}
          </button>
        </span>
      </div>
      <div class="weekday-block">
        <span class="k">{{ t('settings.weekdays') }}</span>
        <div class="weekdays" role="group" :aria-label="t('settings.weekdays')">
          <button
            v-for="day in weekdayOptions"
            :key="day"
            type="button"
            class="wd"
            :class="{ on: scheduleProgress.weekdays.includes(day) }"
            :disabled="isWeekdayDisabled(day)"
            :aria-disabled="isWeekdayDisabled(day)"
            :aria-pressed="scheduleProgress.weekdays.includes(day)"
            :title="isWeekdayDisabled(day) ? t('settings.weekdaysLimit', scheduleProgress.frequencyDays) : undefined"
            @click="toggleWeekday(day)"
          >
            {{ t(`calendar.dow.${day}`) }}
          </button>
        </div>
        <p class="sub weekday-hint">
          {{
            weekdaysAtLimit
              ? t('settings.weekdaysSwap')
              : t('settings.weekdaysLimit', scheduleProgress.frequencyDays)
          }}
        </p>
      </div>
    </section>
    <section class="sec">
      <h4>{{ t('settings.theme') }}</h4>
      <div class="setrow">
        <span class="k">{{ t('settings.themeMode') }}</span>
        <span class="seg">
          <button
            type="button"
            :class="{ on: settings.themeMode === 'light' }"
            :aria-pressed="settings.themeMode === 'light'"
            @click="setMode('light')"
          >
            {{ t('settings.themeLight') }}
          </button>
          <button
            type="button"
            :class="{ on: settings.themeMode === 'system' }"
            :aria-pressed="settings.themeMode === 'system'"
            @click="setMode('system')"
          >
            {{ t('settings.themeSystem') }}
          </button>
          <button
            type="button"
            :class="{ on: settings.themeMode === 'dark' }"
            :aria-pressed="settings.themeMode === 'dark'"
            @click="setMode('dark')"
          >
            {{ t('settings.themeDark') }}
          </button>
        </span>
      </div>
      <div class="setrow">
        <label class="k" for="palette-select">{{ t('settings.palette') }}</label>
        <select
          id="palette-select"
          :value="settings.palette"
          @change="setPalette(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="slug in PALETTE_SLUGS" :key="slug" :value="slug">{{ paletteLabel(slug) }}</option>
        </select>
      </div>
      <div class="setrow last">
        <span class="k">{{ t('settings.language') }}</span>
        <span class="seg">
          <button
            type="button"
            :class="{ on: settings.language === 'en' }"
            :aria-pressed="settings.language === 'en'"
            @click="setLang('en')"
          >
            EN
          </button>
          <button
            type="button"
            :class="{ on: settings.language === 'ru' }"
            :aria-pressed="settings.language === 'ru'"
            @click="setLang('ru')"
          >
            RU
          </button>
        </span>
      </div>
    </section>
    <section class="sec">
      <h4>{{ t('settings.data') }}</h4>
      <button type="button" class="btn" @click="exportBackupFile">
        <AppIcon name="download" />
        {{ t('settings.exportBackup') }}
      </button>
      <button type="button" class="btn" @click="pickBackupFile">
        <AppIcon name="upload" />
        {{ t('settings.importBackup') }}
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept="application/json"
        hidden
        :aria-label="t('settings.importBackup')"
        @change="importBackupFile"
      />
      <p
        class="sub import-message"
        :class="{ ok: importMessage === t('settings.importSuccess') }"
        role="status"
      >
        {{ importMessage }}
      </p>
      <button type="button" class="btn ghost danger" @click="resetAll">
        <AppIcon name="trash" />
        {{ t('settings.resetAll') }}
      </button>
    </section>
    <section class="sec">
      <h4>{{ t('settings.more') }}</h4>
      <RouterLink to="/about" class="btn ghost">{{ t('settings.about') }}</RouterLink>
      <RouterLink to="/why" class="btn ghost">{{ t('settings.whyProgram') }}</RouterLink>
    </section>
    <ConfirmPanel
      :visible="showResetConfirm"
      destructive
      :title="t('settings.resetTitle')"
      :message="t('settings.resetConfirm')"
      @confirm="confirmReset"
      @cancel="showResetConfirm = false"
    />
    <ConfirmPanel
      :visible="showImportConfirm"
      :title="t('settings.importTitle')"
      :message="t('settings.importConfirm')"
      @confirm="confirmImport"
      @cancel="showImportConfirm = false"
    />
  </div>
</template>

<style scoped>
select {
  width: 100%;
  max-width: 100%;
  min-height: 44px;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font: 800 0.7rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.setrow select {
  flex: 1;
  min-width: 0;
  text-align: right;
  text-align-last: right;
  padding: 0 28px 0 12px;
}
.rest-stepper {
  flex-wrap: nowrap;
}
.rest-stepper b {
  min-width: 4.5ch;
  text-align: center;
  font-size: 0.95rem;
}
.weekday-block {
  padding: 10px 0 2px;
}
.weekday-block .k {
  display: block;
  font: 800 0.78rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  margin-bottom: 8px;
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}
.weekday-hint {
  margin-top: 8px;
}
.wd {
  min-height: 44px;
  padding: 0 2px;
  border: 2px solid var(--line);
  background: var(--card);
  font: 800 0.68rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  cursor: pointer;
  color: var(--ink);
}
.wd.on {
  background: var(--accent);
  color: var(--accent-ink);
}
.wd:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sub.ok {
  color: var(--ok);
}
.import-message {
  margin-top: 10px;
}
.import-message:empty {
  margin: 0;
  height: 0;
  overflow: hidden;
}
.row-hint {
  margin: 4px 0 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--line);
}
.row-hint:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.notify-row {
  padding-top: 12px;
}
</style>
