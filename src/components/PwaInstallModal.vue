<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { useModalA11y } from '@/composables/use-modal-a11y'
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

const { panelRef: dialogRef } = useModalA11y(toRef(props, 'visible'), {
  onEscape: () => emit('dismiss'),
})

async function setLang(lang: 'en' | 'ru') {
  await settingsStore.setLanguage(lang)
}

watch(
  () => props.platform,
  (p) => {
    activeTab.value = p
  },
)

const steps = () => {
  const key = `pwa.${activeTab.value}.steps`
  const val = tm(key)
  return Array.isArray(val) ? (val as string[]) : []
}

function selectTab(tab: InstallPlatform) {
  activeTab.value = tab
}

function onTabKeydown(e: KeyboardEvent) {
  const idx = tabs.indexOf(activeTab.value)
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    selectTab(tabs[(idx + 1) % tabs.length])
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    selectTab(tabs[(idx - 1 + tabs.length) % tabs.length])
  } else if (e.key === 'Home') {
    e.preventDefault()
    selectTab(tabs[0])
  } else if (e.key === 'End') {
    e.preventDefault()
    selectTab(tabs[tabs.length - 1])
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay modal-full" role="presentation">
      <div
        ref="dialogRef"
        class="modal-card pwa-modal"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-labelledby="'pwa-dialog-title'"
        :aria-describedby="'pwa-dialog-desc'"
      >
        <div class="pwa-scroll">
          <p class="kicker">{{ t('pwa.title') }}</p>
          <h2 id="pwa-dialog-title">{{ t('pwa.subtitle') }}</h2>
          <p id="pwa-dialog-desc" class="sub pwa-lead">{{ t('pwa.lead') }}</p>
          <div class="langrow" role="group" :aria-label="t('settings.language')">
            <span class="lang-label">{{ t('settings.language') }}</span>
            <span class="seg">
              <button
                type="button"
                :class="{ on: settingsStore.settings?.language === 'en' }"
                :aria-pressed="settingsStore.settings?.language === 'en'"
                @click="setLang('en')"
              >
                EN
              </button>
              <button
                type="button"
                :class="{ on: settingsStore.settings?.language === 'ru' }"
                :aria-pressed="settingsStore.settings?.language === 'ru'"
                @click="setLang('ru')"
              >
                RU
              </button>
            </span>
          </div>
          <div class="tabs" role="tablist" :aria-label="t('pwa.title')" @keydown="onTabKeydown">
            <button
              v-for="tab in tabs"
              :id="`pwa-tab-${tab}`"
              :key="tab"
              type="button"
              role="tab"
              class="tab"
              :class="{ on: tab === activeTab }"
              :aria-selected="tab === activeTab"
              :aria-controls="`pwa-panel-${tab}`"
              :tabindex="tab === activeTab ? 0 : -1"
              @click="selectTab(tab)"
            >
              {{ t(`pwa.tabs.${tab}`) }}
            </button>
          </div>
          <div
            :id="`pwa-panel-${activeTab}`"
            role="tabpanel"
            :aria-labelledby="`pwa-tab-${activeTab}`"
          >
            <p v-if="activeTab === 'ios'" class="note">{{ t('pwa.ios.note') }}</p>
            <ol class="steps">
              <li v-for="(step, i) in steps()" :key="i">
                <span class="step-num">{{ i + 1 }}</span>
                <span>{{ step }}</span>
              </li>
            </ol>
          </div>
        </div>
        <div class="pwa-footer">
          <button v-if="canInstall" type="button" class="btn accent" @click="emit('install')">
            {{ t('common.install') }}
          </button>
          <button
            type="button"
            class="btn"
            :class="canInstall ? 'outline' : 'accent'"
            @click="emit('dismiss')"
          >
            {{ t('common.dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.langrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--line);
}
.langrow .seg {
  margin-left: auto;
}
.lang-label {
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--muted);
}
.pwa-modal {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  min-height: 100dvh;
}
.pwa-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: max(16px, env(safe-area-inset-top, 0px)) 16px 12px;
}
.pwa-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px max(16px, env(safe-area-inset-bottom, 0px));
  border-top: 2px solid var(--line);
  background: var(--card);
}
.pwa-modal h2 {
  font-family: 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  font-size: 1.8rem;
  margin: 0 0 8px;
}
.pwa-lead {
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
  border-radius: 2px;
  background: var(--card);
  cursor: pointer;
  color: var(--ink);
  min-height: 44px;
}
.tab.on {
  background: var(--accent);
  color: var(--accent-ink);
}
.tab {
  transition: background 0.12s ease, color 0.12s ease;
}
@media (prefers-reduced-motion: reduce) {
  .tab {
    transition: none;
  }
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
.steps li:last-child {
  border-bottom: 0;
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
</style>
