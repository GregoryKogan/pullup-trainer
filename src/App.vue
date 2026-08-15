<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import PwaInstallModal from '@/components/PwaInstallModal.vue'
import { usePwaInstall } from '@/composables/use-pwa-install'

const route = useRoute()
const { t } = useI18n()
const pwa = usePwaInstall()

const showTabBar = computed(() =>
  ['home', 'calendar', 'stats', 'settings'].includes(String(route.name)),
)
</script>

<template>
  <div class="app-shell">
    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
      <defs>
        <symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.8 12 3l9 7.8"/><path d="M5.2 9.6V20a1 1 0 0 0 1 1h3.2v-6.2h5.2V21h3.2a1 1 0 0 0 1-1V9.6"/></symbol>
        <symbol id="icon-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2.4"/><path d="M3.2 10h17.6M8 3v4.4M16 3v4.4"/></symbol>
        <symbol id="icon-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3.5 19.5h17"/><path d="M5.5 15.5 10 10.5l3.6 2.8L19 6.5"/></symbol>
        <symbol id="icon-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.4" fill="var(--bg)"/><circle cx="15" cy="17" r="2.4" fill="var(--bg)"/></symbol>
      </defs>
    </svg>
    <main class="app-main" :aria-label="t('common.appTitle')">
      <RouterView />
    </main>
    <AppTabBar v-if="showTabBar" />
    <PwaInstallModal
      :visible="pwa.visible.value"
      :platform="pwa.platform.value"
      :can-install="pwa.canInstall()"
      @dismiss="pwa.dismiss()"
      @install="pwa.install()"
    />
  </div>
</template>
