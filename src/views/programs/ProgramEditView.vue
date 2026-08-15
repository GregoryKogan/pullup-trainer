<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCustomProgram, saveCustomProgram } from '@/db/repositories/custom-programs'
import type { CustomProgram } from '@/domain/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const program = ref<CustomProgram | null>(null)
const loaded = ref(false)

onMounted(async () => {
  const id = Number(route.params.id)
  program.value = (await getCustomProgram(id)) ?? null
  loaded.value = true
})

async function save() {
  if (!program.value) return
  await saveCustomProgram(program.value)
  router.push('/programs')
}

function addStep() {
  if (!program.value) return
  program.value.steps.push({
    sets: [{ position: 1, type: 'reps', unit: 'reps', planned: 5 }],
    restDaysAfter: 1,
  })
}

function addSet(stepIndex: number) {
  if (!program.value) return
  const step = program.value.steps[stepIndex]
  step.sets.push({
    position: step.sets.length + 1,
    type: 'reps',
    unit: 'reps',
    planned: 5,
  })
}
</script>

<template>
  <div v-if="program">
    <header class="head">
      <div>
        <p class="kicker">{{ t('programs.kicker') }}</p>
        <h2>{{ program.name }}</h2>
      </div>
    </header>
    <label class="field">
      {{ t('programs.name') }}
      <input v-model="program.name" />
    </label>
    <section v-for="(step, si) in program.steps" :key="si" class="sec">
      <h4>{{ t('programs.stepN', { n: si + 1 }) }}</h4>
      <div v-for="(set, seti) in step.sets" :key="seti" class="set-edit-row">
        <select v-model="set.type">
          <option value="reps">{{ t('programs.setTypes.reps') }}</option>
          <option value="max">{{ t('programs.setTypes.max') }}</option>
          <option value="hold">{{ t('programs.setTypes.hold') }}</option>
          <option value="negative">{{ t('programs.setTypes.negative') }}</option>
          <option value="assisted">{{ t('programs.setTypes.assisted') }}</option>
        </select>
        <input v-model.number="set.planned" type="number" min="1" />
        <select v-model="set.unit">
          <option value="reps">{{ t('workout.reps') }}</option>
          <option value="seconds">{{ t('workout.seconds') }}</option>
        </select>
      </div>
      <button type="button" class="btn ghost" @click="addSet(si)">{{ t('programs.addSet') }}</button>
      <label class="rest-field">
        {{ t('programs.restDays') }}
        <input v-model.number="step.restDaysAfter" type="number" min="0" />
      </label>
    </section>
    <button type="button" class="btn" @click="addStep">{{ t('programs.addStep') }}</button>
    <button type="button" class="btn accent" @click="save">{{ t('common.save') }}</button>
    <RouterLink to="/programs" class="btn ghost back">{{ t('common.back') }}</RouterLink>
  </div>
  <div v-else-if="loaded" class="panel not-found">
    <p class="sub">{{ t('programs.notFound') }}</p>
    <RouterLink to="/programs" class="btn accent">{{ t('common.back') }}</RouterLink>
  </div>
</template>

<style scoped>
.field {
  display: block;
  margin-bottom: 12px;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.field input {
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  border: 2px solid var(--line);
  padding: 8px;
}
.set-edit-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.set-edit-row input,
.set-edit-row select {
  min-height: 44px;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
}
.rest-field {
  display: block;
  margin-top: 8px;
  font: 800 0.78rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.rest-field input {
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  border: 2px solid var(--line);
  padding: 8px;
  background: var(--bg);
  color: var(--ink);
}
.back {
  display: inline-block;
  margin-top: 12px;
  text-align: center;
  text-decoration: none;
}
.not-found {
  margin-top: 24px;
  text-align: center;
}
</style>
