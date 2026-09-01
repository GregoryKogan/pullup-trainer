<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
    defaultSeconds?: number
  }>(),
  {
    paused: false,
    minSeconds: REST_MIN_SECONDS,
    maxSeconds: REST_MAX_SECONDS,
    defaultSeconds: 0,
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

const ANNOUNCE_EVERY_SECONDS = 30
const ANNOUNCE_TAIL_SECONDS = 5

const ringLabel = ref('')

watch(
  () => [props.total, props.remaining, props.paused] as const,
  ([total, remaining, paused]) => {
    if (total <= 0) {
      ringLabel.value = `${props.label}: ${t('workout.chooseRest')}`
      return
    }
    if (paused) {
      ringLabel.value = `${props.label}: ${t('workout.pause')} ${formatTime(remaining)}`
      return
    }
    if (
      remaining === total ||
      remaining <= ANNOUNCE_TAIL_SECONDS ||
      remaining % ANNOUNCE_EVERY_SECONDS === 0
    ) {
      ringLabel.value = `${props.label}: ${formatTime(remaining)}`
    }
  },
  { immediate: true },
)

const displayTime = computed(() => formatTime(props.remaining))

const offset = computed(() => {
  const c = 2 * Math.PI * 52
  const p = props.total > 0 ? props.remaining / props.total : 0
  return c * (1 - p)
})

const atMin = computed(() => props.remaining <= props.minSeconds)
const atMax = computed(() => props.remaining >= props.maxSeconds)

const almostDone = computed(
  () => props.total > 0 && !props.paused && props.remaining > 0 && props.remaining <= 5,
)

function isSuggested(seconds: number) {
  return props.total === 0 && seconds === props.defaultSeconds
}
</script>

<template>
  <div class="rest-layout">
    <section class="rest-hero">
      <p class="sr-only" aria-live="polite" aria-atomic="true">{{ ringLabel }}</p>
      <div class="ring-stack">
        <template v-if="total > 0">
          <svg class="ring" :class="{ ending: almostDone }" viewBox="0 0 120 120" aria-hidden="true">
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
            <span class="ring-lab-text">{{ label }}</span>
          </p>
        </template>
        <div v-else class="rest-prompt">
          <IconTimer :size="44" class="rest-prompt-icon" aria-hidden="true" />
          <p class="rest-prompt-text">{{ t('workout.chooseRest') }}</p>
        </div>
      </div>
    </section>
    <section class="rest-dock panel">
      <div class="presets">
        <button
          v-for="sec in REST_PRESET_SECONDS"
          :key="sec"
          type="button"
          class="mini preset"
          :class="{ on: total === sec, suggested: isSuggested(sec) }"
          :aria-pressed="total === sec"
          :aria-describedby="isSuggested(sec) ? 'rest-default-hint' : undefined"
          @click="emit('preset', sec)"
        >
          {{ formatTime(sec) }}
        </button>
        <span id="rest-default-hint" class="sr-only">{{ t('workout.restDefault') }}</span>
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
          <AppIcon name="minus" :size="15" />
          {{ t('workout.adjustStep') }}
        </button>
        <button
          type="button"
          class="mini icon-mini"
          :class="{ inactive: atMax }"
          :disabled="atMax"
          :aria-label="t('workout.adjustPlus')"
          @click="emit('plus')"
        >
          <AppIcon name="plus" :size="15" />
          {{ t('workout.adjustStep') }}
        </button>
      </div>
      <div class="restrow">
        <button type="button" class="mini skip-btn" @click="emit('skip')">
          <AppIcon name="arrow-right" :size="15" />
          {{ t('workout.skipRest') }}
        </button>
        <button
          v-if="total > 0 && !paused"
          type="button"
          class="mini reset-btn"
          @click="emit('pause')"
        >
          <AppIcon name="pause" :size="15" />
          {{ t('workout.pause') }}
        </button>
        <button
          v-else-if="total > 0 && paused"
          type="button"
          class="mini reset-btn"
          @click="emit('resume')"
        >
          <AppIcon name="play" :size="15" />
          {{ t('workout.resume') }}
        </button>
        <button v-if="total > 0" type="button" class="mini reset-btn" @click="emit('reset')">
          <AppIcon name="reset" :size="15" />
          {{ t('workout.reset') }}
        </button>
      </div>
      <p v-if="total === 0" class="resthint">{{ t('workout.restHint') }}</p>
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
.rest-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}
.rest-prompt-icon {
  flex-shrink: 0;
  color: var(--accent-text);
}
.rest-prompt-text {
  margin: 0;
  font: 800 0.95rem/1.2 'Arial Black', system-ui, sans-serif;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.ring .bg {
  stroke: color-mix(in srgb, var(--muted) 40%, transparent);
  fill: none;
  stroke-width: 7;
}
.ring .fg {
  stroke: var(--accent);
  fill: none;
  stroke-width: 7;
  stroke-linecap: butt;
  transition: stroke-dashoffset 0.95s linear;
}
.ring-num {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-weight: 800;
  fill: var(--ink);
}
.ring.ending .fg {
  stroke: var(--accent2);
}
.ring.ending .ring-num {
  fill: var(--accent2);
  animation: ring-tick 1s steps(2, jump-none) infinite;
}
@keyframes ring-tick {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.45;
  }
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
.presets .mini.on {
  background: var(--accent);
  color: var(--accent-ink);
}
.presets .mini.suggested {
  border-color: var(--accent-text);
  color: var(--accent-text);
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
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.mini:active:not(:disabled):not(.inactive) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--shadow);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
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
@media (max-height: 520px) {
  .rest-layout {
    flex: 0 0 auto;
  }
  .rest-hero {
    flex: 0 0 auto;
    padding: 0 0 10px;
  }
  .ring {
    width: clamp(96px, min(52vw, 30vh), 160px);
    height: clamp(96px, min(52vw, 30vh), 160px);
  }
  .ring-stack {
    gap: 8px;
  }
  .rest-prompt-icon {
    display: none;
  }
  .rest-dock {
    padding: 10px 12px max(10px, env(safe-area-inset-bottom, 0px));
  }
  .presets,
  .restrow {
    margin-bottom: 6px;
  }
  .resthint {
    margin-top: 6px;
  }
}
@media (max-height: 520px) and (min-width: 560px) {
  .rest-layout {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  .rest-hero {
    flex: 1 1 0;
    min-width: 0;
    padding: 0;
  }
  .rest-dock {
    flex: 1 1 0;
    min-width: 0;
  }
}
@media (hover: hover) and (pointer: fine) {
  .mini:hover:not(:disabled):not(.inactive) {
    box-shadow: 5px 5px 0 var(--shadow);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ring .fg {
    transition: none;
  }
  .ring.ending .ring-num {
    animation: none;
  }
  .mini:active:not(:disabled):not(.inactive) {
    transform: none;
    box-shadow: 3px 3px 0 var(--shadow);
  }
}
</style>
