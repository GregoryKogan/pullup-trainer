<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'

defineProps<{
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
</script>

<template>
  <div class="sets-wrap">
    <div class="setsrow" :aria-label="t('workout.setsRow')">
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
        <span>{{
          s.doneFlag ? t('workout.setLabel', { n: i + 1 }) : s.current ? t('workout.setNow') : t('workout.setLabel', { n: i + 1 })
        }}</span>
      </div>
    </div>
    <p v-if="sets.length > 4" class="scroll-hint">{{ t('workout.setsScrollHint') }}</p>
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
.setsrow span {
  font: 700 0.68rem/1.2 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
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
.setsrow .s.now b,
.setsrow .s.now span {
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
  .setsrow span {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
  }
}
</style>
