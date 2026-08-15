<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { loadCustomPrograms, saveCustomProgram, deleteCustomProgram } from '@/db/repositories/custom-programs'
import { useProgressStore } from '@/stores/progress'
import type { CustomProgram } from '@/domain/types'

const { t } = useI18n()
const router = useRouter()
const progressStore = useProgressStore()
const programs = ref<CustomProgram[]>([])

onMounted(async () => {
  programs.value = await loadCustomPrograms()
})

async function createProgram() {
  const id = await saveCustomProgram({
    name: 'My Program',
    steps: [{ sets: [{ position: 1, type: 'reps', unit: 'reps', planned: 5 }] }],
  })
  router.push(`/programs/${id}/edit`)
}

async function remove(id: number) {
  await deleteCustomProgram(id)
  programs.value = await loadCustomPrograms()
}

async function activate(id: number) {
  await progressStore.setCustomActive(id, 0)
  router.push('/')
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <p class="kicker">Custom</p>
        <h2>{{ t('programs.title') }}</h2>
      </div>
    </header>
    <button type="button" class="btn accent" @click="createProgram">{{ t('programs.new') }}</button>
    <section v-for="p in programs" :key="p.id" class="panel">
      <h3>{{ p.name }}</h3>
      <p class="sub">{{ p.steps.length }} {{ t('programs.steps') }}</p>
      <div class="btnrow">
        <button type="button" class="btn" @click="router.push(`/programs/${p.id}/edit`)">Edit</button>
        <button type="button" class="btn accent" @click="activate(p.id!)">{{ t('programs.setActive') }}</button>
        <button type="button" class="btn ghost danger" @click="remove(p.id!)">{{ t('common.delete') }}</button>
      </div>
    </section>
    <button type="button" class="btn ghost" @click="router.push('/settings')">{{ t('common.back') }}</button>
  </div>
</template>

<style scoped>
h3 {
  font-family: 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  margin: 0;
}
</style>
