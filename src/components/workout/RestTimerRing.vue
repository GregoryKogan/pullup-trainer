<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'
import IconTimer from '@/components/icons/lucide/IconTimer.vue'
import { REST_PRESET_SECONDS, REST_MAX_SECONDS, REST_MIN_SECONDS } from '@/constants/app'
import { formatTime } from '@/utils/dates'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    remaining: number
    total: number
    label: string
    paused?: boolean
    minSeconds?: number
    maxSeconds?: number
  }>(),
  {
    paused: false,
    minSeconds: REST_MIN_SECONDS,
    maxSeconds: REST_MAX_SECONDS,
  },
)

const emit = defineEmits<{
  minus: []
  plus: []
  reset: []
  skip: []
  pause: []
  resume: []
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

const atMin = computed(() => props.remaining <= props.minSeconds)
const atMax = computed(() => props.remaining >= props.maxSeconds)
</script>

<template>
  <div class="rest-layout">
    <section class="rest-hero">
      <p class="sr-only" aria-live="polite" aria-atomic="true">{{ ringLabel }}</p>
      <div class="ring-stack">
        <svg class="ring" viewBox="0 0 120 120" role="img" :aria-label="ringLabel" aria-hidden="true">
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
          <text
            class="ring-num"
            x="60"
            y="60"
            font-size="27"
            text-anchor="middle"
            dominant-baseline="central"
          >{{ displayTime }}</text>
        </svg>
        <p class="ring-lab">
          <IconTimer :size="16" class="ring-icon" aria-hidden="true" />
          <span class="ring-lab-text">{{ total > 0 ? label : t('workout.chooseRest') }}</span>
        </p>
      </div>
    </section>
    <section class="rest-dock panel">
      <div class="presets">
        <button
          v-for="sec in REST_PRESET_SECONDS"
          :key="sec"
          type="button"
          class="mini"
          @click="emit('preset', sec)"
        >
          {{ formatTime(sec) }}
        </button>
      </div>
      <div v-if="total > 0" class="restrow">
        <button
          type="button"
          class="mini icon-mini"
          :class="{ inactive: atMin }"
          :disabled="atMin"
          :aria-label="t('workout.adjustMinus')"
          @click="emit('minus')"
        >
          <AppIcon name="minus" :size="16" />
        </button>
        <button
          type="button"
          class="mini icon-mini"
          :class="{ inactive: atMax }"
          :disabled="atMax"
          :aria-label="t('workout.adjustPlus')"
          @click="emit('plus')"
        >
          <AppIcon name="plus" :size="16" />
        </button>
      </div>
      <div class="restrow">
        <button type="button" class="mini skip-btn" @click="emit('skip')">
          <AppIcon name="arrow-right" :size="15" />
          {{ $t('workout.skipRest') }}
        </button>
        <button
          v-if="total > 0 && !paused"
          type="button"
          class="mini reset-btn"
          @click="emit('pause')"
        >
          <AppIcon name="pause" :size="15" />
          {{ $t('workout.pause') }}
        </button>
        <button
          v-else-if="total > 0 && paused"
          type="button"
          class="mini reset-btn"
          @click="emit('resume')"
        >
          <AppIcon name="play" :size="15" />
          {{ $t('workout.resume') }}
        </button>
        <button v-if="total > 0" type="button" class="mini reset-btn" @click="emit('reset')">
          <AppIcon name="reset" :size="15" />
          {{ $t('workout.reset') }}
        </button>
      </div>
      <p class="resthint">{{ $t('workout.restHint') }}</p>
    </section>
  </div>
</template>

<style scoped>
.rest-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.rest-hero {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 12px;
}
.ring-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.ring {
  width: clamp(168px, min(52vw, 34vh), 240px);
  height: clamp(168px, min(52vw, 34vh), 240px);
  flex-shrink: 0;
  display: block;
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
  stroke-linecap: butt;
}
.ring-num {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-weight: 800;
  fill: var(--ink);
}
.ring-lab {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 16px;
  font: 700 0.68rem/16px ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
}
.ring-icon {
  flex-shrink: 0;
  display: block;
  color: var(--accent-text);
}
.ring-lab-text {
  display: block;
  line-height: 16px;
  transform: translateY(2px);
}
.rest-dock {
  flex-shrink: 0;
  padding: 14px 16px max(16px, env(safe-area-inset-bottom, 0px));
}
.presets {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.presets .mini {
  flex: 1;
  font-size: 0.72rem;
}
.restrow {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.restrow:last-of-type {
  margin-bottom: 0;
}
.mini {
  appearance: none;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  flex: 1;
  background: var(--bg);
  border: 2px solid var(--line);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--shadow);
  color: var(--ink);
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.mini:focus-visible {
  outline: 3px solid var(--accent2);
  outline-offset: 2px;
}
.mini:disabled,
.mini.inactive {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}
.icon-mini {
  display: flex;
  align-items: center;
  justify-content: center;
}
.skip-btn,
.reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.resthint {
  font: 700 0.68rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
  margin: 10px 0 0;
  text-align: center;
}
</style>
