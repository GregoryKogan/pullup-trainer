<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCustomProgram, saveCustomProgram } from '@/db/repositories/custom-programs'
import type { CustomProgram } from '@/domain/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const program = ref<CustomProgram | null>(null)

onMounted(async () => {
  const id = Number(route.params.id)
  program.value = (await getCustomProgram(id)) ?? null
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
      <h2>{{ program.name }}</h2>
    </header>
    <label class="field">
      {{ t('programs.name') }}
      <input v-model="program.name" />
    </label>
    <section v-for="(step, si) in program.steps" :key="si" class="sec">
      <h4>Step {{ si + 1 }}</h4>
      <div v-for="(set, seti) in step.sets" :key="seti" class="setrow">
        <select v-model="set.type">
          <option value="reps">reps</option>
          <option value="max">max</option>
          <option value="hold">hold</option>
          <option value="negative">negative</option>
          <option value="assisted">assisted</option>
        </select>
        <input v-model.number="set.planned" type="number" min="1" />
        <select v-model="set.unit">
          <option value="reps">reps</option>
          <option value="seconds">seconds</option>
        </select>
      </div>
      <button type="button" class="btn ghost" @click="addSet(si)">{{ t('programs.addSet') }}</button>
      <label>
        {{ t('programs.restDays') }}
        <input v-model.number="step.restDaysAfter" type="number" min="0" />
      </label>
    </section>
    <button type="button" class="btn" @click="addStep">{{ t('programs.addStep') }}</button>
    <button type="button" class="btn accent" @click="save">{{ t('common.save') }}</button>
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
.setrow {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.setrow input,
.setrow select {
  min-height: 44px;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
}
</style>
