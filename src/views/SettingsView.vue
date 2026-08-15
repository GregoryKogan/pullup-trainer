<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import { useSettingsStore } from '@/stores/settings'
import { useProgressStore } from '@/stores/progress'
import { PALETTE_SLUGS, PALETTE_LABELS } from '@/utils/theme'
import { exportBackup, validateBackup, defaultSettings } from '@/domain/export'
import { downloadJson } from '@/utils/platform'
import { db } from '@/db/database'
import { loadCustomPrograms } from '@/db/repositories/custom-programs'
import { saveSettings } from '@/db/repositories/settings'
import { saveProgress } from '@/db/repositories/progress'
import { setLocale } from '@/i18n'
import type { ThemeMode } from '@/domain/types'

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const progressStore = useProgressStore()

const settings = computed(() => settingsStore.settings)

async function changeRest(delta: number) {
  const s = settings.value
  if (!s) return
  await settingsStore.update({ restDurationSeconds: Math.max(30, s.restDurationSeconds + delta) })
}

async function toggleAutoStart() {
  const s = settings.value
  if (!s) return
  await settingsStore.update({ restAutoStart: !s.restAutoStart })
}

async function setMode(mode: ThemeMode) {
  await settingsStore.setThemeMode(mode)
}

async function setLang(lang: 'en' | 'ru') {
  await settingsStore.setLanguage(lang)
  setLocale(lang)
}

async function setPalette(slug: string) {
  await settingsStore.setPalette(slug)
}

async function exportBackupFile() {
  const programs = await loadCustomPrograms()
  const data = exportBackup(
    settings.value ?? defaultSettings(),
    programs,
    progressStore.progress,
    progressStore.records,
    '1.0.0',
  )
  downloadJson('pullup-trainer-backup.json', data)
}

async function importBackupFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const text = await file.text()
  const data = JSON.parse(text) as unknown
  if (!validateBackup(data)) return
  await saveSettings(data.settings)
  await db.customPrograms.clear()
  for (const p of data.customPrograms) {
    await db.customPrograms.add(p)
  }
  await saveProgress(data.activeProgress)
  await db.workoutRecords.clear()
  for (const r of data.history) {
    await db.workoutRecords.add(r as never)
  }
  await settingsStore.hydrate()
  await progressStore.hydrate()
}

async function resetAll() {
  if (!confirm(t('settings.resetConfirm'))) return
  await db.delete()
  await db.open()
  await settingsStore.hydrate()
  await progressStore.hydrate()
  router.push('/onboarding')
}
</script>

<template>
  <div v-if="settings">
    <header class="head">
      <div>
        <p class="kicker">Poster · Swiss</p>
        <h2>{{ t('settings.title') }}</h2>
      </div>
    </header>
    <section class="sec">
      <h4>{{ t('settings.restTimer') }}</h4>
      <div class="setrow">
        <span class="k">{{ t('settings.restDuration') }}</span>
        <span class="v">
          <b>{{ Math.floor(settings.restDurationSeconds / 60) }}:{{ String(settings.restDurationSeconds % 60).padStart(2, '0') }}</b>
          <button type="button" class="iconbtn" style="width: 40px; height: 40px" @click="changeRest(-15)">−</button>
          <button type="button" class="iconbtn" style="width: 40px; height: 40px" @click="changeRest(15)">+</button>
        </span>
      </div>
      <div class="setrow">
        <span class="k">{{ t('settings.autoStart') }}</span>
        <button
          type="button"
          class="sw"
          :class="{ on: settings.restAutoStart }"
          @click="toggleAutoStart"
        >
          <i />
        </button>
      </div>
      <div class="setrow last">
        <span class="k">{{ t('settings.signal') }}</span>
        <span class="v"><b>{{ t('settings.signalValue') }}</b></span>
      </div>
      <p class="sub">{{ t('settings.noSound') }}</p>
    </section>
    <section class="sec">
      <h4>{{ t('settings.theme') }}</h4>
      <div class="setrow">
        <span class="k">{{ t('settings.themeMode') }}</span>
        <span class="seg">
          <button :class="{ on: settings.themeMode === 'light' }" @click="setMode('light')">light</button>
          <button :class="{ on: settings.themeMode === 'system' }" @click="setMode('system')">system</button>
          <button :class="{ on: settings.themeMode === 'dark' }" @click="setMode('dark')">dark</button>
        </span>
      </div>
      <div class="setrow">
        <span class="k">{{ t('settings.palette') }}</span>
        <select :value="settings.palette" @change="setPalette(($event.target as HTMLSelectElement).value)">
          <option v-for="slug in PALETTE_SLUGS" :key="slug" :value="slug">{{ PALETTE_LABELS[slug] }}</option>
        </select>
      </div>
      <div class="setrow last">
        <span class="k">{{ t('settings.language') }}</span>
        <span class="seg">
          <button :class="{ on: settings.language === 'en' }" @click="setLang('en')">EN</button>
          <button :class="{ on: settings.language === 'ru' }" @click="setLang('ru')">RU</button>
        </span>
      </div>
    </section>
    <section class="sec">
      <h4>{{ t('settings.data') }}</h4>
      <button type="button" class="btn" @click="exportBackupFile">{{ t('settings.exportBackup') }}</button>
      <label class="btn">
        {{ t('settings.importBackup') }}
        <input type="file" accept="application/json" hidden @change="importBackupFile" />
      </label>
      <button type="button" class="btn ghost danger" @click="resetAll">{{ t('settings.resetAll') }}</button>
    </section>
    <section class="sec">
      <h4>{{ t('settings.about') }}</h4>
      <RouterLink to="/about" class="btn ghost">{{ t('settings.about') }}</RouterLink>
      <RouterLink to="/why" class="btn ghost">{{ t('settings.whyProgram') }}</RouterLink>
      <RouterLink to="/programs" class="btn ghost">{{ t('settings.customPrograms') }}</RouterLink>
    </section>
    <AppTabBar />
  </div>
</template>

<style scoped>
select {
  min-height: 38px;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font: 800 0.7rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
</style>
