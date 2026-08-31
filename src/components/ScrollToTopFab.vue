<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'
import { useScrollTopFab } from '@/composables/use-scroll-top-fab'

const props = defineProps<{ anchorSelector?: string }>()

const { t } = useI18n()
const { visible, scrollToTop } = useScrollTopFab(props.anchorSelector)
</script>

<template>
  <button
    type="button"
    class="scroll-top-fab iconbtn"
    :class="{ visible }"
    :aria-label="t('common.scrollToTop')"
    @click="scrollToTop"
  >
    <AppIcon name="arrow-up" :size="20" />
  </button>
</template>

<style scoped>
.scroll-top-fab {
  position: fixed;
  right: max(18px, env(safe-area-inset-right, 0px));
  bottom: max(18px, env(safe-area-inset-bottom, 0px));
  z-index: 50;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.scroll-top-fab.visible {
  opacity: 1;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-top-fab {
    transition: none;
  }
}
</style>
