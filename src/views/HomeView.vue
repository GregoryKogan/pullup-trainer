<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTabBar from '@/components/AppTabBar.vue'
import { useProgressStore } from '@/stores/progress'
import { session } from '@/domain/session'
import { formatDisplayDate, startOfWeek, todayLocal } from '@/utils/dates'

const router = useRouter()
const { t, locale } = useI18n()
const progressStore = useProgressStore()

const nextSlot = computed(() => progressStore.getNextSlot())

const setsPreview = computed(() => {
  const p = progressStore.progress
  if (!p || !nextSlot.value) return ''
  if (p.source === 'builtin' && p.state.path === 'L') {
    const s = session(p.state.anchor, nextSlot.value.stepRef)
    return s.sets.map((x) => x.planned).join('·')
  }
  if (p.source === 'builtin' && p.state.path === 'P0') {
    return `P0-${p.state.path0Step}`
  }
  return ''
})

const maxReps = computed(() => {
  let max = 0
  for (const r of progressStore.records) {
    max = Math.max(max, r.totals.maxSetReps)
    if (r.kind === 'test') {
      const d = r.sets[0]?.done ?? 0
      max = Math.max(max, d)
    }
  }
  return max
})

const weekVolume = computed(() => {
  const start = startOfWeek(todayLocal())
  return progressStore.records
    .filter((r) => r.date >= start && r.kind === 'workout')
    .reduce((sum, r) => sum + r.totals.volumeReps, 0)
})

const cycleInfo = computed(() => {
  const p = progressStore.progress
  if (!p || p.source !== 'builtin' || p.state.path !== 'L') return null
  return { step: p.state.stepInCycle, cycle: p.state.cycleIndex + 1 }
})

function startWorkout() {
  router.push('/workout')
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <p class="kicker">{{ formatDisplayDate(todayLocal(), locale) }}</p>
        <h2>{{ t('home.title') }}</h2>
      </div>
    </header>
    <section v-if="nextSlot" class="panel next">
      <p class="kicker">{{ t('home.nextWorkout') }}</p>
      <div class="row">
        <h3>{{ formatDisplayDate(nextSlot.date, locale) }}</h3>
        <span class="sets">{{ setsPreview }}</span>
      </div>
      <div class="meter"><i :style="{ width: '27%' }" /></div>
      <p v-if="cycleInfo" class="sub">
        {{ t('home.stepProgress', { step: cycleInfo.step, cycle: cycleInfo.cycle }) }}
      </p>
      <button type="button" class="btn accent" @click="startWorkout">{{ t('common.start') }}</button>
    </section>
    <p v-else class="sub">{{ t('home.noProgress') }}</p>
    <div class="grid2">
      <section class="panel tile">
        <p class="kicker">{{ t('home.maxReps') }}</p>
        <b class="big">{{ maxReps }}</b>
      </section>
      <section class="panel tile">
        <p class="kicker">{{ t('home.volumeWeek') }}</p>
        <b class="big">{{ weekVolume }}</b>
      </section>
    </div>
    <AppTabBar />
  </div>
</template>

<style scoped>
.next .row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 8px 0 12px;
}
.next h3 {
  font-family: 'Arial Black', system-ui, sans-serif;
  font-size: 1.3rem;
  margin: 0;
  text-transform: uppercase;
}
.sets {
  font: 800 0.85rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--accent);
}
.meter {
  height: 10px;
  background: var(--bg2);
  border: 2px solid var(--line);
  margin: 8px 0 10px;
}
.meter i {
  display: block;
  height: 100%;
  background: var(--accent);
}
</style>
