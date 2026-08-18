<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const STROKE_WIDTH = 2.5
const VIEWBOX_PAD = 4
const BASELINE_Y = 82
const EST_DIGIT_WIDTH = 52
const MIN_INNER_WIDTH = 100
const VIEW_HEIGHT = 100

const props = defineProps<{
  value: string | number
}>()

const text = computed(() => String(props.value))
const textEl = ref<SVGTextElement | null>(null)

function buildEstimate(value: string) {
  const chars = value.replace(/\D/g, '').length || value.length || 1
  const innerWidth = Math.max(MIN_INNER_WIDTH, chars * EST_DIGIT_WIDTH)
  const viewWidth = innerWidth + VIEWBOX_PAD * 2
  const viewHeight = VIEW_HEIGHT + VIEWBOX_PAD * 2
  return {
    textX: VIEWBOX_PAD,
    viewBox: `-${VIEWBOX_PAD} -${VIEWBOX_PAD} ${viewWidth} ${viewHeight}`,
    ratio: viewWidth / viewHeight,
  }
}

const initialLayout = buildEstimate(String(props.value))
const textX = ref(initialLayout.textX)
const viewBox = ref(initialLayout.viewBox)
const layoutRatio = ref(initialLayout.ratio)

function applyLayout(innerWidth: number) {
  const viewWidth = innerWidth + VIEWBOX_PAD * 2
  const viewHeight = VIEW_HEIGHT + VIEWBOX_PAD * 2
  viewBox.value = `-${VIEWBOX_PAD} -${VIEWBOX_PAD} ${viewWidth} ${viewHeight}`
  layoutRatio.value = viewWidth / viewHeight
}

function applyEstimate(value: string) {
  const estimate = buildEstimate(value)
  textX.value = estimate.textX
  viewBox.value = estimate.viewBox
  layoutRatio.value = estimate.ratio
}

async function measure() {
  textX.value = 0
  await nextTick()

  const el = textEl.value
  if (!el) return

  let bb: DOMRect
  try {
    bb = el.getBBox()
  } catch {
    applyEstimate(text.value)
    return
  }

  if (!Number.isFinite(bb.width) || bb.width <= 0) {
    applyEstimate(text.value)
    return
  }

  const innerWidth = Math.max(MIN_INNER_WIDTH, Math.ceil(bb.width))
  textX.value = VIEWBOX_PAD + (innerWidth - bb.width) / 2 - bb.x
  applyLayout(innerWidth)
}

watch(text, () => {
  applyEstimate(text.value)
  void measure()
})

onMounted(() => {
  applyEstimate(text.value)
  void measure()
})

const svgStyle = computed(() => ({
  width: `min(100%, calc(1em * ${layoutRatio.value}))`,
  height: '1em',
  maxWidth: '100%',
}))
</script>

<template>
  <span class="contour-number-wrap">
    <svg
      class="contour-number"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      :style="svgStyle"
    >
      <text
        ref="textEl"
        class="contour-number-text"
        :x="textX"
        :y="BASELINE_Y"
        fill="none"
        stroke="currentColor"
        :stroke-width="STROKE_WIDTH"
        stroke-linejoin="round"
        stroke-linecap="round"
      >
        {{ text }}
      </text>
    </svg>
    <span class="sr-only">{{ text }}</span>
  </span>
</template>

<style scoped>
.contour-number-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
  line-height: 1;
}
.contour-number {
  display: block;
  flex-shrink: 0;
  font-size: clamp(5rem, min(28vw, 26vh), 9rem);
  color: var(--accent);
  overflow: visible;
}
.contour-number-text {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 88px;
  font-weight: 900;
}
</style>
