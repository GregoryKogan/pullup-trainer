<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { setLocale } from '@/i18n'
import type { InstallPlatform } from '@/utils/platform'

const props = defineProps<{
  visible: boolean
  platform: InstallPlatform
  canInstall: boolean
}>()

const emit = defineEmits<{ dismiss: []; install: [] }>()

const { t, tm } = useI18n()
const settingsStore = useSettingsStore()
const tabs: InstallPlatform[] = ['ios', 'android', 'desktop', 'other']
const activeTab = ref<InstallPlatform>(props.platform)
const dialogRef = ref<HTMLElement | null>(null)
let escapeHandler: ((e: KeyboardEvent) => void) | null = null

async function setLang(lang: 'en' | 'ru') {
  if (settingsStore.settings) {
    await settingsStore.setLanguage(lang)
  }
  setLocale(lang)
}

watch(
  () => props.platform,
  (p) => {
    activeTab.value = p
  },
)

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick()
      dialogRef.value?.focus()
      escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') emit('dismiss')
      }
      window.addEventListener('keydown', escapeHandler)
    } else if (escapeHandler) {
      window.removeEventListener('keydown', escapeHandler)
      escapeHandler = null
    }
  },
)

onBeforeUnmount(() => {
  if (escapeHandler) window.removeEventListener('keydown', escapeHandler)
})

const steps = () => {
  const key = `pwa.${activeTab.value}.steps`
  const val = tm(key)
  return Array.isArray(val) ? (val as string[]) : []
}
</script>

<template>
  <div v-if="visible" class="modal-overlay modal-full" role="presentation">
    <div
      ref="dialogRef"
      class="modal-card pwa-modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      :aria-labelledby="'pwa-dialog-title'"
    >
      <p class="kicker">{{ t('pwa.title') }}</p>
      <h2 id="pwa-dialog-title">{{ t('pwa.subtitle') }}</h2>
      <div class="langrow" role="group" :aria-label="t('settings.language')">
        <span class="lang-label">{{ t('settings.language') }}</span>
        <span class="seg">
          <button
            type="button"
            :class="{ on: settingsStore.settings?.language === 'en' }"
            @click="setLang('en')"
          >
            EN
          </button>
          <button
            type="button"
            :class="{ on: settingsStore.settings?.language === 'ru' }"
            @click="setLang('ru')"
          >
            RU
          </button>
        </span>
      </div>
      <div class="tabs" role="tablist" :aria-label="t('pwa.title')">
        <button
          v-for="tab in tabs"
          :key="tab"
          type="button"
          role="tab"
          class="tab"
          :class="{ on: tab === activeTab }"
          :aria-selected="tab === activeTab"
          :aria-controls="`pwa-panel-${tab}`"
          :tabindex="tab === activeTab ? 0 : -1"
          @click="activeTab = tab"
        >
          {{ t(`pwa.tabs.${tab}`) }}
        </button>
      </div>
      <p v-if="activeTab === 'ios'" class="note">{{ t('pwa.ios.note') }}</p>
      <ol :id="`pwa-panel-${activeTab}`" class="steps" role="tabpanel">
        <li v-for="(step, i) in steps()" :key="i">
          <span class="step-num">{{ i + 1 }}</span>
          <span>{{ step }}</span>
        </li>
      </ol>
      <div class="illus" aria-hidden="true">
        <svg v-if="activeTab === 'ios'" viewBox="0 0 200 120" width="200" height="120">
          <rect x="10" y="10" width="180" height="100" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
          <rect x="140" y="18" width="40" height="14" fill="var(--accent)" />
          <path d="M150 25h20M160 20v10" stroke="var(--accent-ink)" stroke-width="2" />
          <rect x="30" y="50" width="120" height="8" fill="var(--muted)" />
          <rect x="30" y="70" width="90" height="8" fill="var(--muted)" />
        </svg>
        <svg v-else-if="activeTab === 'android'" viewBox="0 0 200 120" width="200" height="120">
          <rect x="10" y="10" width="180" height="100" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
          <rect x="150" y="16" width="28" height="28" fill="var(--accent)" />
          <rect x="30" y="55" width="100" height="10" fill="var(--accent)" />
          <rect x="30" y="75" width="80" height="8" fill="var(--muted)" />
        </svg>
        <svg v-else viewBox="0 0 200 120" width="200" height="120">
          <rect x="10" y="10" width="180" height="100" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
          <rect x="30" y="30" width="140" height="12" fill="var(--accent)" />
          <rect x="30" y="55" width="90" height="8" fill="var(--muted)" />
          <rect x="30" y="75" width="110" height="8" fill="var(--muted)" />
        </svg>
      </div>
      <button v-if="canInstall" type="button" class="btn accent" @click="emit('install')">
        {{ t('common.install') }}
      </button>
      <button type="button" class="btn outline" @click="emit('dismiss')">{{ t('common.dismiss') }}</button>
    </div>
  </div>
</template>

<style scoped>
.langrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--line);
}
.lang-label {
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--muted);
}
.pwa-modal h2 {
  font-family: 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  font-size: 1.2rem;
  margin: 0 0 12px;
}
.tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.tab {
  font: 700 0.65rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  padding: 6px 10px;
  border: 2px solid var(--line);
  opacity: 0.6;
  background: var(--card);
  cursor: pointer;
  color: var(--ink);
  min-height: 44px;
}
.tab.on {
  background: var(--accent);
  color: var(--accent-ink);
  opacity: 1;
}
.note {
  font-size: 0.75rem;
  color: var(--muted);
}
.steps {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
}
.steps li {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 44px;
  border-bottom: 2px solid var(--line);
  font: 700 0.78rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
}
.step-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--accent-ink);
  border: 2px solid var(--line);
  font-weight: 800;
  flex-shrink: 0;
}
.illus {
  display: flex;
  justify-content: center;
  margin: 12px 0;
}
</style>
