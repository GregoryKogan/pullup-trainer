<script setup lang="ts">
defineProps<{
  sets: { planned: number; done?: number; current?: boolean; doneFlag?: boolean }[]
}>()

const emit = defineEmits<{ select: [index: number] }>()
</script>

<template>
  <div class="setsrow" aria-label="Sets">
    <button
      v-for="(s, i) in sets"
      :key="i"
      type="button"
      class="s"
      :class="{ done: s.doneFlag, now: s.current }"
      @click="emit('select', i)"
    >
      <b>{{ s.done ?? s.planned }}</b>
      <span>{{ s.doneFlag ? `Set ${i + 1}` : s.current ? 'Now' : `Set ${i + 1}` }}</span>
    </button>
  </div>
</template>

<style scoped>
.setsrow {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.setsrow .s {
  flex: 1;
  min-height: 62px;
  border-radius: 2px;
  background: var(--card);
  border: 2px solid var(--line);
  box-shadow: 3px 3px 0 var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  appearance: none;
  color: inherit;
}
.setsrow b {
  font: 800 1.2rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
}
.setsrow span {
  font: 700 0.56rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
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
</style>
