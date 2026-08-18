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
}
.contour-number {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: clamp(5rem, min(28vw, 26vh), 9rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.03em;
  color: var(--bg);
  -webkit-text-stroke: 0.05em var(--accent);
  paint-order: stroke fill;
  -webkit-font-smoothing: antialiased;
}
@supports not (-webkit-text-stroke: 1px #000) {
  .contour-number {
    color: var(--accent);
    -webkit-text-stroke: 0;
    paint-order: normal;
  }
}
</style>
