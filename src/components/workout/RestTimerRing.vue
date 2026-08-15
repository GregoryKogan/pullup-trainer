<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTime } from '@/utils/dates'

const { t } = useI18n()

const props = defineProps<{
  remaining: number
  total: number
  paused: boolean
  label: string
}>()

const emit = defineEmits<{
  minus: []
  plus: []
  pause: []
  reset: []
  skip: []
  preset: [seconds: number]
}>()

const ringLabel = computed(() => {
  if (props.total <= 0) return `${props.label}: ${t('workout.chooseRest')}`
  return `${props.label}: ${formatTime(props.remaining)}`
})

const displayTime = computed(() => (props.total > 0 ? formatTime(props.remaining) : '—'))

const offset = computed(() => {
  const c = 2 * Math.PI * 52
  const p = props.total > 0 ? props.remaining / props.total : 0
  return c * (1 - p)
})
</script>

<template>
  <section class="restcard">
    <svg class="ring" viewBox="0 0 120 120" width="100" height="100" role="img" :aria-label="ringLabel">
      <circle class="bg" cx="60" cy="60" r="52" />
      <circle
        class="fg"
        cx="60"
        cy="60"
        r="52"
        :stroke-dasharray="326.7"
        :stroke-dashoffset="offset"
        transform="rotate(-90 60 60)"
      />
      <text class="ring-num" x="60" y="57" text-anchor="middle">{{ displayTime }}</text>
      <text class="ring-lab" x="60" y="73" text-anchor="middle">{{ total > 0 ? label : t('workout.chooseRest') }}</text>
    </svg>
    <div class="restbody">
      <div class="presets">
        <button type="button" class="mini" @click="emit('preset', 90)">{{ t('workout.restPreset90') }}</button>
        <button type="button" class="mini" @click="emit('preset', 180)">{{ t('workout.restPreset180') }}</button>
        <button type="button" class="mini" @click="emit('preset', 300)">{{ t('workout.restPreset300') }}</button>
      </div>
      <div v-if="total > 0" class="restrow">
        <button type="button" class="mini" @click="emit('minus')">{{ t('workout.adjustMinus') }}</button>
        <button
          type="button"
          class="mini"
          :aria-label="paused ? t('workout.resume') : t('workout.pause')"
          @click="emit('pause')"
        >
          <svg v-if="!paused" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" fill="currentColor" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" class="mini" @click="emit('plus')">{{ t('workout.adjustPlus') }}</button>
      </div>
      <div v-if="total > 0" class="restrow">
        <button type="button" class="mini" @click="emit('reset')">{{ $t('workout.reset') }}</button>
        <button type="button" class="mini" @click="emit('skip')">{{ $t('workout.skipRest') }}</button>
      </div>
      <p class="resthint">{{ $t('workout.restHint') }}</p>
    </div>
  </section>
</template>

<style scoped>
.restcard {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--card);
  border: 2px solid var(--line);
  border-radius: 2px;
  box-shadow: 5px 5px 0 var(--shadow);
  padding: 12px 14px;
  margin-bottom: 14px;
}
.ring .bg {
  stroke: var(--line);
  fill: none;
  stroke-width: 7;
}
.ring .fg {
  stroke: var(--accent);
  fill: none;
  stroke-width: 7;
  stroke-linecap: round;
}
.ring-num {
  font: 800 24px/1 ui-monospace, 'SF Mono', Menlo, monospace;
  fill: var(--ink);
}
.ring-lab {
  font: 700 10px/1 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.18em;
  fill: var(--muted);
}
.restbody {
  flex: 1;
}
.presets {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.presets .mini {
  flex: 1;
  font-size: 0.72rem;
}
.restrow {
  display: flex;
  gap: 7px;
  margin-bottom: 8px;
}
.mini {
  appearance: none;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  flex: 1;
  background: var(--card);
  border: 2px solid var(--line);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--shadow);
  color: var(--ink);
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.resthint {
  font: 700 0.68rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
  margin: 0;
}
</style>
