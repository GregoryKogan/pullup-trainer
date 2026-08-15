<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InstallPlatform } from '@/utils/platform'

const props = defineProps<{
  visible: boolean
  platform: InstallPlatform
  canInstall: boolean
}>()

const emit = defineEmits<{ dismiss: []; install: [] }>()

const { t, tm } = useI18n()
const tabs: InstallPlatform[] = ['ios', 'android', 'desktop', 'other']
const activeTab = computed(() => props.platform)

const steps = computed(() => {
  const key = `pwa.${activeTab.value}.steps`
  const val = tm(key)
  return Array.isArray(val) ? (val as string[]) : []
})
</script>

<template>
  <div v-if="visible" class="modal-overlay modal-full" role="dialog" aria-modal="true">
    <div class="modal-card pwa-modal">
      <p class="kicker">{{ t('pwa.title') }}</p>
      <h2>{{ t('pwa.subtitle') }}</h2>
      <div class="tabs">
        <span v-for="tab in tabs" :key="tab" class="tab" :class="{ on: tab === activeTab }">
          {{ t(`pwa.tabs.${tab}`) }}
        </span>
      </div>
      <p v-if="activeTab === 'ios'" class="note">{{ t('pwa.ios.note') }}</p>
      <ol class="steps">
        <li v-for="(step, i) in steps" :key="i">
          <span class="step-num">{{ i + 1 }}</span>
          <span>{{ step }}</span>
        </li>
      </ol>
      <div class="illus" aria-hidden="true">
        <svg viewBox="0 0 200 120" width="200" height="120">
          <rect x="10" y="10" width="180" height="100" fill="var(--card)" stroke="var(--line)" stroke-width="2" />
          <rect x="30" y="30" width="140" height="12" fill="var(--accent)" />
          <rect x="30" y="55" width="90" height="8" fill="var(--muted)" />
          <rect x="30" y="75" width="110" height="8" fill="var(--muted)" />
        </svg>
      </div>
      <button v-if="canInstall" type="button" class="btn accent" @click="emit('install')">
        {{ t('common.install') }}
      </button>
      <button type="button" class="btn ghost" @click="emit('dismiss')">{{ t('common.dismiss') }}</button>
    </div>
  </div>
</template>

<style scoped>
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
}
.illus {
  display: flex;
  justify-content: center;
  margin: 12px 0;
}
</style>
