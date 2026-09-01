<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string | number
}>()

const text = computed(() => String(props.value))
</script>

<template>
  <span class="contour-number-wrap">
    <span class="contour-number" aria-hidden="true">{{ text }}</span>
    <span class="sr-only">{{ text }}</span>
  </span>
</template>

<style scoped>
.contour-number-wrap {
  display: block;
  width: 100%;
  text-align: center;
  line-height: 1;
  animation: contour-in 0.34s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}
@keyframes contour-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (max-height: 520px) {
  .contour-number {
    font-size: clamp(2.5rem, min(18vw, 17vh), 6rem);
  }
}
@media (prefers-reduced-motion: reduce) {
  .contour-number-wrap {
    animation: none;
  }
}
.contour-number {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: clamp(5rem, min(28vw, 26vh), 9rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.03em;
  color: var(--bg);
  -webkit-text-stroke: 0.05em var(--accent-text);
  paint-order: stroke fill;
  -webkit-font-smoothing: antialiased;
}
@supports not (-webkit-text-stroke: 1px #000) {
  .contour-number {
    color: var(--accent-text);
    -webkit-text-stroke: 0;
    paint-order: normal;
  }
}
</style>
