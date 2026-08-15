<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { safeBack } from '@/utils/navigation'

const { t, tm } = useI18n()
const router = useRouter()

const sections = ['frequency', 'volume', 'workingSets', 'finalMax', 'rest', 'autoreg', 'retest', 'path0', 'skips'] as const

const formulas = computed(() => {
  const items = tm('science.formulas.items') as { name: string; formula: string; example: string }[]
  return Array.isArray(items) ? items : []
})

const sources = computed(() => {
  const items = tm('science.sources') as { id: number; title: string; url: string; badge: string }[]
  return Array.isArray(items) ? items : []
})
</script>

<template>
  <div class="science page">
    <div class="subpage-head">
      <button type="button" class="btn ghost" @click="safeBack(router)">{{ t('common.back') }}</button>
      <header class="head">
        <div>
          <p class="kicker">{{ t('why.kicker') }}</p>
          <h1>{{ t('science.title') }}</h1>
        </div>
      </header>
    </div>
    <section class="panel">
      <p>{{ t('science.headline') }}</p>
    </section>
    <section v-for="key in sections" :key="key" class="sec">
      <h4>{{ t(`science.sections.${key}.title`) }}</h4>
      <p>{{ t(`science.sections.${key}.body`) }}</p>
    </section>
    <section class="sec">
      <h4>{{ t('science.formulas.title') }}</h4>
      <div v-for="(f, i) in formulas" :key="i" class="formula">
        <b>{{ f.name }}</b>
        <code>{{ f.formula }}</code>
        <span class="sub">{{ f.example }}</span>
      </div>
    </section>
    <section id="sources" class="sec">
      <h4>{{ t('science.sourcesTitle') }}</h4>
      <ul class="sources">
        <li v-for="s in sources" :key="s.id">
          <span class="badge">{{ t(`science.badges.${s.badge}`) }}</span>
          <a :href="s.url" target="_blank" rel="noopener">{{ s.title }}</a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.formula {
  border-bottom: 2px solid var(--line);
  padding: 10px 0;
}
.formula code {
  display: block;
  font: 700 0.75rem/1.4 ui-monospace, 'SF Mono', Menlo, monospace;
  margin: 6px 0;
  overflow-x: auto;
  word-break: break-word;
}
.sources {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sources li {
  padding: 10px 0;
  border-bottom: 2px solid var(--line);
}
.badge {
  display: inline-block;
  font: 700 0.6rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  background: var(--bg2);
  padding: 3px 6px;
  margin-right: 8px;
  border: 1px solid var(--line);
}
</style>
