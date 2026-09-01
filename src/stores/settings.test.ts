import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { db } from '@/db/database'

type MediaListener = (e: { matches: boolean }) => void

let systemPrefersDark = false
let listeners: MediaListener[] = []

function installMatchMedia() {
  listeners = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('dark') ? systemPrefersDark : false,
    media: query,
    addEventListener: (_: string, fn: MediaListener) => listeners.push(fn),
    removeEventListener: (_: string, fn: MediaListener) => {
      listeners = listeners.filter((l) => l !== fn)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  }))
}

function setSystemDark(value: boolean) {
  systemPrefersDark = value
  for (const fn of listeners) fn({ matches: value })
}

describe('useSettingsStore', () => {
  beforeEach(async () => {
    systemPrefersDark = false
    installMatchMedia()
    setActivePinia(createPinia())
    await db.settings.clear()
    document.documentElement.removeAttribute('data-theme')
    document.head.innerHTML = ''
  })

  describe('hydrate', () => {
    it('creates and stores defaults on first run', async () => {
      const store = useSettingsStore()
      await store.hydrate()

      expect(store.settings?.palette).toBe('p01-volt')
      expect(store.settings?.themeMode).toBe('system')
      expect(store.settings?.language).toBe('en')
      expect(await db.settings.get('singleton')).toBeTruthy()
    })

    it('applies the theme attribute on the root element', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      expect(document.documentElement.dataset.theme).toBe('p01-volt-light')
    })

    it('reads persisted settings back', async () => {
      const first = useSettingsStore()
      await first.hydrate()
      await first.setPalette('p03-cobalt')
      await first.setThemeMode('dark')

      setActivePinia(createPinia())
      const second = useSettingsStore()
      await second.hydrate()

      expect(second.settings?.palette).toBe('p03-cobalt')
      expect(second.settings?.themeMode).toBe('dark')
      expect(document.documentElement.dataset.theme).toBe('p03-cobalt-dark')
    })
  })

  describe('resolvedMode', () => {
    it.each([
      ['dark', true, 'dark'],
      ['light', true, 'light'],
      ['dark', false, 'dark'],
      ['light', false, 'light'],
    ])('honours the explicit %s mode regardless of the system', async (mode, sysDark, expected) => {
      systemPrefersDark = sysDark
      installMatchMedia()
      const store = useSettingsStore()
      await store.hydrate()
      await store.setThemeMode(mode as 'dark' | 'light')
      expect(store.resolvedMode()).toBe(expected)
    })

    it.each([
      [true, 'dark'],
      [false, 'light'],
    ])('follows the system when set to system (dark=%s)', async (sysDark, expected) => {
      systemPrefersDark = sysDark
      installMatchMedia()
      const store = useSettingsStore()
      await store.hydrate()
      expect(store.settings?.themeMode).toBe('system')
      expect(store.resolvedMode()).toBe(expected)
    })

    it('reacts to the system switching while set to system', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      expect(document.documentElement.dataset.theme).toBe('p01-volt-light')

      setSystemDark(true)

      expect(store.resolvedMode()).toBe('dark')
      expect(document.documentElement.dataset.theme).toBe('p01-volt-dark')
    })

    it('ignores the system switching once a mode is pinned', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      await store.setThemeMode('light')

      setSystemDark(true)

      expect(store.resolvedMode()).toBe('light')
      expect(document.documentElement.dataset.theme).toBe('p01-volt-light')
    })
  })

  describe('setPalette', () => {
    it('accepts a known palette slug and persists it', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      await store.setPalette('p14-mono-ink')

      expect(store.settings?.palette).toBe('p14-mono-ink')
      expect((await db.settings.get('singleton'))?.palette).toBe('p14-mono-ink')
    })

    it('rejects an unknown slug', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      await store.setPalette('p99-not-a-palette')
      expect(store.settings?.palette).toBe('p01-volt')
    })
  })

  describe('setLanguage', () => {
    it('persists the language and sets the document lang', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      await store.setLanguage('ru')

      expect(store.settings?.language).toBe('ru')
      expect(document.documentElement.lang).toBe('ru')
      expect((await db.settings.get('singleton'))?.language).toBe('ru')
    })
  })

  describe('update', () => {
    it('merges a partial change without dropping other fields', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      await store.update({ restDurationSeconds: 90, restNotify: true })

      expect(store.settings?.restDurationSeconds).toBe(90)
      expect(store.settings?.restNotify).toBe(true)
      expect(store.settings?.palette).toBe('p01-volt')
      expect(store.settings?.language).toBe('en')
    })

    it('does nothing before hydrate', async () => {
      const store = useSettingsStore()
      await store.update({ restDurationSeconds: 90 })
      expect(store.settings).toBeNull()
      expect(await db.settings.count()).toBe(0)
    })
  })

  describe('applyTheme', () => {
    it('syncs the theme-color meta tag with the resolved background', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      meta.setAttribute('content', '#000000')
      document.head.appendChild(meta)

      const store = useSettingsStore()
      await store.hydrate()
      await nextTick()

      expect(document.documentElement.dataset.theme).toBe('p01-volt-light')
      expect(meta.getAttribute('content')).toBeTruthy()
    })

    it('sets color-scheme so native controls follow the resolved mode', async () => {
      const store = useSettingsStore()
      await store.hydrate()
      await nextTick()
      expect(document.documentElement.style.colorScheme).toBe('light')

      await store.setThemeMode('dark')
      await nextTick()
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })
  })
})
