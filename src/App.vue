<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import IconSprite from '@/components/icons/IconSprite.vue'
import PwaInstallModal from '@/components/PwaInstallModal.vue'
import { usePwaInstall } from '@/composables/use-pwa-install'

const route = useRoute()
const { t } = useI18n()
const pwa = usePwaInstall()

const showTabBar = computed(
  () =>
    ['home', 'calendar', 'stats', 'settings'].includes(String(route.name)) &&
    !pwa.visible.value,
)

const fitMain = computed(() => route.name === 'workout')
</script>

<template>
  <div class="app-shell">
    <IconSprite />
    <main class="app-main" :class="{ 'app-main--fit': fitMain }" :aria-label="t('common.appTitle')">
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
