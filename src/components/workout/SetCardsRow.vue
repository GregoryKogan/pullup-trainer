<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'
import { rowNeedsScroll } from '@/utils/set-cards-row'

const props = defineProps<{
  sets: {
    planned: number
    done?: number
    current?: boolean
    doneFlag?: boolean
    isMax?: boolean
  }[]
}>()

const { t } = useI18n()
const setsRowScroll = ref<HTMLElement | null>(null)
const showScrollHint = ref(false)
let resizeObserver: ResizeObserver | null = null

function updateScrollHint() {
  showScrollHint.value = rowNeedsScroll(setsRowScroll.value)
}

watch(
  () => props.sets,
  () => nextTick(updateScrollHint),
  { deep: true },
)

onMounted(() => {
  nextTick(updateScrollHint)
  if (typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => updateScrollHint())
  if (setsRowScroll.value) resizeObserver.observe(setsRowScroll.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="sets-wrap">
    <div ref="setsRowScroll" class="setsrow-scroll" :aria-label="t('workout.setsRow')">
      <div class="setsrow">
        <div
          v-for="(s, i) in sets"
          :key="i"
          class="s"
          :class="{ done: s.doneFlag, now: s.current, max: s.isMax }"
          :aria-label="t('workout.setLabel', { n: i + 1 })"
          :aria-current="s.current ? 'step' : undefined"
        >
          <span v-if="s.doneFlag" class="check"><AppIcon name="check" :size="12" /></span>
          <b>{{ s.done ?? s.planned }}</b>
          <span v-if="s.isMax" class="tag">{{ t('workout.maxTag') }}</span>
        </div>
      </div>
    </div>
    <p v-if="showScrollHint" class="scroll-hint">{{ t('workout.setsScrollHint') }}</p>
  </div>
</template>

<style scoped>
.sets-wrap {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.setsrow-scroll {
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  padding-bottom: 2px;
}
.setsrow {
  display: flex;
  gap: 8px;
}
.setsrow .s {
  flex: 0 0 62px;
  width: 62px;
  min-height: 62px;
  scroll-snap-align: center;
  border-radius: 2px;
  background: var(--card);
  border: 2px solid var(--line);
  box-shadow: 3px 3px 0 var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: inherit;
  position: relative;
}
.setsrow .check {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--ok);
  display: flex;
}
.setsrow b {
  font: 800 1.2rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.setsrow .s.done {
  border-color: var(--ok);
}
.setsrow .s.done b {
  color: var(--ok);
}
.setsrow .s.now {
  background: var(--accent);
  border-color: var(--line);
  box-shadow: 4px 4px 0 var(--shadow);
}
.setsrow .s.now b {
  color: var(--accent-ink);
}
.setsrow .s.now .check {
  color: var(--accent-ink);
}
.setsrow .tag {
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  text-align: center;
  font: 800 0.5rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.setsrow .s.now .tag {
  color: var(--accent-ink);
}
.setsrow .s.max b {
  margin-bottom: 7px;
}
.scroll-hint {
  margin: 6px 0 0;
  font: 700 0.62rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
}
@media (max-width: 360px) {
  .setsrow {
    gap: 5px;
  }
  .setsrow b {
    font-size: 1rem;
  }
}
</style>
