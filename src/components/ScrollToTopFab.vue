<script setup lang="ts">
import { useI18n } from 'vue-i18n'
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
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
