<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'

const route = useRoute()
const { t } = useI18n()

const tabs = [
  { to: '/', name: 'home', icon: 'home', label: 'nav.home' },
  { to: '/calendar', name: 'calendar', icon: 'cal', label: 'nav.calendar' },
  { to: '/stats', name: 'stats', icon: 'chart', label: 'nav.stats' },
  { to: '/settings', name: 'settings', icon: 'sliders', label: 'nav.settings' },
]

function isActive(tab: (typeof tabs)[0]) {
  if (tab.to === '/') return route.path === '/'
  return route.path.startsWith(tab.to)
}
</script>

<template>
  <nav class="tabbar" :aria-label="t('nav.main')">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.to"
      :class="{ on: isActive(tab) }"
      :aria-current="isActive(tab) ? 'page' : undefined"
    >
      <AppIcon :name="tab.icon" />
      {{ t(tab.label) }}
    </RouterLink>
  </nav>
</template>
