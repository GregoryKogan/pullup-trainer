<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ConfirmPanel from '@/components/ConfirmPanel.vue'
import { loadCustomPrograms, saveCustomProgram, deleteCustomProgram } from '@/db/repositories/custom-programs'
import { useProgressStore } from '@/stores/progress'
import type { CustomProgram } from '@/domain/types'

const { t } = useI18n()
const router = useRouter()
const progressStore = useProgressStore()
const programs = ref<CustomProgram[]>([])
const stepPick = ref<Record<number, number>>({})
const deleteTarget = ref<number | null>(null)

onMounted(async () => {
  programs.value = await loadCustomPrograms()
  for (const p of programs.value) {
    if (p.id) stepPick.value[p.id] = 0
  }
})

async function createProgram() {
  const id = await saveCustomProgram({
    name: t('programs.defaultName'),
    steps: [{ sets: [{ position: 1, type: 'reps', unit: 'reps', planned: 5 }] }],
  })
  router.push(`/programs/${id}/edit`)
}

async function activateBuiltin() {
  await progressStore.activateBuiltin()
  router.push('/')
}

async function remove(id: number) {
  deleteTarget.value = id
}

async function confirmDelete() {
  if (deleteTarget.value === null) return
  await deleteCustomProgram(deleteTarget.value)
  deleteTarget.value = null
  programs.value = await loadCustomPrograms()
}

async function activate(id: number) {
  const step = stepPick.value[id] ?? 0
  await progressStore.setCustomActive(id, step)
  router.push('/')
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <p class="kicker">{{ t('programs.kicker') }}</p>
        <h2>{{ t('programs.title') }}</h2>
      </div>
    </header>
    <button type="button" class="btn accent" @click="createProgram">{{ t('programs.new') }}</button>
    <button
      v-if="progressStore.progress?.source === 'custom'"
      type="button"
      class="btn ghost"
      @click="activateBuiltin"
    >
      {{ t('programs.useBuiltin') }}
    </button>
    <section v-for="p in programs" :key="p.id" class="panel">
      <h3>{{ p.name }}</h3>
      <p class="sub">{{ p.steps.length }} {{ t('programs.steps') }}</p>
      <label v-if="p.id" class="step-pick">
        <span>{{ t('programs.jumpToStep') }}</span>
        <select v-model.number="stepPick[p.id]">
          <option v-for="(_, i) in p.steps" :key="i" :value="i">{{ t('programs.stepN', { n: i + 1 }) }}</option>
        </select>
      </label>
      <div class="btnrow">
        <button type="button" class="btn" @click="router.push(`/programs/${p.id}/edit`)">{{ t('programs.edit') }}</button>
        <button type="button" class="btn accent" @click="activate(p.id!)">{{ t('programs.setActive') }}</button>
        <button type="button" class="btn ghost danger" @click="remove(p.id!)">{{ t('common.delete') }}</button>
      </div>
    </section>
    <button type="button" class="btn ghost" @click="router.push('/settings')">{{ t('common.back') }}</button>
    <ConfirmPanel
      :visible="deleteTarget !== null"
      :message="t('programs.deleteConfirm')"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
h3 {
  font-family: 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  margin: 0;
}
.step-pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 10px 0;
  font: 800 0.72rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.step-pick select {
  min-height: 44px;
  border: 2px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  padding: 0 8px;
}
</style>
