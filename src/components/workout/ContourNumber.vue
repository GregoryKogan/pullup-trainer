<script setup lang="ts">
import { computed } from 'vue'
import {
  CONTOUR_DIGITS,
  CONTOUR_STROKE_WIDTH,
  DIGIT_GAP,
  DIGIT_HEIGHT,
  type ContourDigit,
} from './contour-digit-paths'

const props = defineProps<{
  value: string | number
}>()

const text = computed(() => String(props.value))

type PlacedDigit = ContourDigit & { x: number }

const layout = computed(() => {
  const chars = text.value.split('').filter((char) => char in CONTOUR_DIGITS)
  const digits = chars.map((char) => CONTOUR_DIGITS[char]!)
  if (digits.length === 0) {
    return { viewWidth: 100, digits: [] as PlacedDigit[] }
  }

  const contentWidth =
    digits.reduce((sum, digit) => sum + digit.width, 0) + DIGIT_GAP * (digits.length - 1)
  const viewWidth = Math.max(100, Math.ceil(contentWidth))
  let offset = (viewWidth - contentWidth) / 2
  const placed = digits.map((digit) => {
    const x = offset
    offset += digit.width + DIGIT_GAP
    return { ...digit, x }
  })

  return { viewWidth, digits: placed }
})

const viewBox = computed(() => `0 0 ${layout.value.viewWidth} ${DIGIT_HEIGHT}`)

function digitTransform(digit: PlacedDigit) {
  return `translate(${digit.x}, 0) translate(${-digit.originX}, ${-digit.originY}) scale(${digit.scale})`
}
</script>

<template>
  <span class="contour-number-wrap">
    <svg
      class="contour-number"
      :viewBox="viewBox"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      :style="{ aspectRatio: `${layout.viewWidth} / ${DIGIT_HEIGHT}` }"
    >
      <path
        v-for="(digit, index) in layout.digits"
        :key="`${digit.d}-${index}`"
        :d="digit.d"
        :transform="digitTransform(digit)"
        fill="none"
        stroke="currentColor"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
        :stroke-width="CONTOUR_STROKE_WIDTH"
      />
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
</style>
