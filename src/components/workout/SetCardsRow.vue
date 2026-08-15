<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'
import { rowNeedsScroll } from '@/utils/set-cards-row'

const props = defineProps<{
  sets: {
    planned: number
    type?: string
    unit?: string
    done?: number
    current?: boolean
    doneFlag?: boolean
  }[]
}>()

const { t } = useI18n()
const setsRow = ref<HTMLElement | null>(null)
const showScrollHint = ref(false)
let resizeObserver: ResizeObserver | null = null

function updateScrollHint() {
  showScrollHint.value = rowNeedsScroll(setsRow.value)
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
  if (setsRow.value) resizeObserver.observe(setsRow.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="sets-wrap">
    <div ref="setsRow" class="setsrow" :aria-label="t('workout.setsRow')">
      <div
        v-for="(s, i) in sets"
        :key="i"
        class="s"
        :class="{ done: s.doneFlag, now: s.current }"
        :aria-label="t('workout.setLabel', { n: i + 1 })"
        :aria-current="s.current ? 'step' : undefined"
      >
        <span v-if="s.doneFlag" class="check"><AppIcon name="check" :size="12" /></span>
        <b>{{ s.done ?? s.planned }}</b>
      </div>
    </div>
    <p v-if="showScrollHint" class="scroll-hint">{{ t('workout.setsScrollHint') }}</p>
  </div>
</template>

<style scoped>
.sets-wrap {
  margin-bottom: 16px;
}
.setsrow {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
  padding-bottom: 2px;
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
