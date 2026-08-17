<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string | number
}>()

const text = computed(() => String(props.value))
const viewWidth = computed(() => Math.max(100, text.value.length * 68))
const viewBox = computed(() => `0 0 ${viewWidth.value} 100`)
const centerX = computed(() => viewWidth.value / 2)
</script>

<template>
  <span class="contour-number-wrap">
    <svg
      class="contour-number"
      :viewBox="viewBox"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      :style="{ aspectRatio: `${viewWidth} / 100` }"
    >
      <text
        :x="centerX"
        y="82"
        text-anchor="middle"
        fill="none"
        stroke="currentColor"
        stroke-linejoin="round"
        stroke-linecap="round"
        paint-order="stroke"
      >
        {{ text }}
      </text>
    </svg>
    <span class="sr-only">{{ text }}</span>
  </span>
</template>

<style scoped>
.contour-number-wrap {
  display: block;
  line-height: 1;
}
.contour-number {
  display: block;
  height: 1em;
  width: auto;
  max-width: 100%;
  font-size: clamp(5rem, min(28vw, 26vh), 9rem);
  color: var(--accent);
  overflow: visible;
}

.contour-number text {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 88px;
  font-weight: 900;
  stroke-width: 0.028em;
}
</style>
