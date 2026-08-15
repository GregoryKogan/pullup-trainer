import { defineStore } from 'pinia'
import { shallowRef, watch } from 'vue'
import type { AppSettings, ThemeMode } from '@/domain/types'
import { loadSettings, saveSettings } from '@/db/repositories/settings'
import { PALETTE_SLUGS } from '@/utils/theme'

export const useSettingsStore = defineStore('settings', () => {
  const settings = shallowRef<AppSettings | null>(null)
  const systemDark = shallowRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  async function hydrate() {
    settings.value = await loadSettings()
    applyTheme()
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        systemDark.value = e.matches
        applyTheme()
      })
    }
  }

  function resolvedMode(): 'light' | 'dark' {
    const mode = settings.value?.themeMode ?? 'system'
    if (mode === 'system') return systemDark.value ? 'dark' : 'light'
    return mode
  }

  function applyTheme() {
    if (typeof document === 'undefined' || !settings.value) return
    const palette = settings.value.palette
    const mode = resolvedMode()
    document.documentElement.dataset.theme = `${palette}-${mode}`
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', mode === 'dark' ? '#0E0E0B' : '#F4F2EA')
    }
  }

  async function update(partial: Partial<AppSettings>) {
    if (!settings.value) return
    settings.value = { ...settings.value, ...partial }
    await saveSettings(settings.value)
    applyTheme()
  }

  async function setPalette(slug: string) {
    if (!(PALETTE_SLUGS as readonly string[]).includes(slug)) return
    await update({ palette: slug })
  }

  async function setThemeMode(mode: ThemeMode) {
    await update({ themeMode: mode })
  }

  async function setLanguage(lang: 'en' | 'ru') {
    await update({ language: lang })
  }

  watch(settings, applyTheme)

  return {
    settings,
    hydrate,
    update,
    setPalette,
    setThemeMode,
    setLanguage,
    resolvedMode,
    applyTheme,
  }
})
