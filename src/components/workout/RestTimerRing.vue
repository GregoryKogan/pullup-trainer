<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/icons/AppIcon.vue'
import { REST_PRESET_SECONDS } from '@/constants/app'
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
    <p class="sr-only" aria-live="polite" aria-atomic="true">{{ ringLabel }}</p>
    <svg class="ring" viewBox="0 0 120 120" width="100" height="100" role="img" :aria-label="ringLabel" aria-hidden="true">
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
      <div class="restrow">
        <button type="button" class="mini skip-btn" @click="emit('skip')">{{ $t('workout.skipRest') }}</button>
      </div>
      <div v-if="total > 0" class="restrow">
        <button type="button" class="mini icon-mini" :aria-label="t('workout.adjustMinus')" @click="emit('minus')">
          <AppIcon name="minus" :size="16" />
        </button>
        <button
          type="button"
          class="mini icon-mini"
          :aria-label="paused ? t('workout.resume') : t('workout.pause')"
          @click="emit('pause')"
        >
          <AppIcon v-if="!paused" name="pause" :size="16" />
          <AppIcon v-else name="play" :size="16" />
        </button>
        <button type="button" class="mini icon-mini" :aria-label="t('workout.adjustPlus')" @click="emit('plus')">
          <AppIcon name="plus" :size="16" />
        </button>
      </div>
      <div v-if="total > 0" class="restrow">
        <button type="button" class="mini reset-btn" @click="emit('reset')">
          <AppIcon name="reset" :size="15" />
          {{ $t('workout.reset') }}
        </button>
      </div>
      <p class="resthint">
        <AppIcon name="vibrate" />
        {{ $t('workout.restHint') }}
      </p>
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
@media (max-width: 380px) {
  .restcard {
    flex-direction: column;
    align-items: stretch;
  }
  .ring {
    align-self: center;
  }
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
.mini:focus-visible {
  outline: 3px solid var(--accent2);
  outline-offset: 2px;
}
.icon-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
}
.reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}
.skip-btn {
  flex: 1;
}
.resthint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font: 700 0.68rem/1.3 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--muted);
  margin: 0;
}
.resthint svg {
  flex: 0 0 auto;
  margin-top: 1px;
}
</style>
