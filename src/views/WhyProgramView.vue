<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ScrollToTopFab from '@/components/ScrollToTopFab.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { safeBack, scrollToHash } from '@/utils/navigation'

const { t, tm } = useI18n()
const route = useRoute()
const router = useRouter()

function scrollIfHash() {
  if (!route.hash) return
  nextTick(() => scrollToHash(route.hash))
}

onMounted(scrollIfHash)
watch(() => route.hash, scrollIfHash)

const sections = [
  'overview',
  'levels',
  'algorithm',
  'progression',
  'frequency',
  'volume',
  'workingSets',
  'finalMax',
  'rest',
  'path0',
  'skips',
  'rejected',
  'limitations',
] as const

function parseCitations(text: string): { type: 'text' | 'cite'; value: string }[] {
  const parts: { type: 'text' | 'cite'; value: string }[] = []
  const re = /\[(\d+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'cite', value: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return parts
}

function asParagraphs(key: string): string[] {
  const val = tm(`science.sections.${key}.body`)
  return Array.isArray(val) ? (val as string[]) : []
}

const introParagraphs = computed(() => {
  const val = tm('science.intro')
  return Array.isArray(val) ? (val as string[]) : []
})

const formulas = computed(() => {
  const items = tm('science.formulas.items') as {
    name: string
    formula: string
    example: string
    note?: string
  }[]
  return Array.isArray(items) ? items : []
})

const sources = computed(() => {
  const items = tm('science.sources') as {
    id: number
    title: string
    url: string
    badge: string
    journal?: string
    year?: string
  }[]
  return Array.isArray(items) ? items : []
})
</script>

<template>
  <div class="science page">
    <div class="subpage-head">
      <button type="button" class="btn ghost" @click="safeBack(router)">
        <AppIcon name="chev-left" />
        {{ t('common.back') }}
      </button>
      <header class="head">
        <div>
          <p class="kicker">{{ t('why.kicker') }}</p>
          <h1>{{ t('science.title') }}</h1>
        </div>
      </header>
    </div>
    <section class="sec">
      <h4>{{ t('science.introTitle') }}</h4>
      <p v-for="(para, i) in introParagraphs" :key="`intro-${i}`">
        <template v-for="(part, j) in parseCitations(para)" :key="`intro-${i}-${j}`">
          <a v-if="part.type === 'cite'" :href="`#source-${part.value}`" class="cite">[{{ part.value }}]</a>
          <span v-else>{{ part.value }}</span>
        </template>
      </p>
    </section>
    <section v-for="key in sections" :key="key" class="sec">
      <h4>{{ t(`science.sections.${key}.title`) }}</h4>
      <p v-for="(para, i) in asParagraphs(key)" :key="`${key}-${i}`">
        <template v-for="(part, j) in parseCitations(para)" :key="`${key}-${i}-${j}`">
          <a v-if="part.type === 'cite'" :href="`#source-${part.value}`" class="cite">[{{ part.value }}]</a>
          <span v-else>{{ part.value }}</span>
        </template>
      </p>
    </section>
    <section class="sec">
      <h4>{{ t('science.formulas.title') }}</h4>
      <div v-for="(f, i) in formulas" :key="i" class="formula">
        <b>{{ f.name }}</b>
        <code>{{ f.formula }}</code>
        <span class="sub">{{ f.example }}</span>
        <span v-if="f.note" class="sub note">
          <template v-for="(part, j) in parseCitations(f.note)" :key="`note-${i}-${j}`">
            <a v-if="part.type === 'cite'" :href="`#source-${part.value}`" class="cite">[{{ part.value }}]</a>
            <span v-else>{{ part.value }}</span>
          </template>
        </span>
      </div>
    </section>
    <section id="sources" class="sec">
      <h4>{{ t('science.sourcesTitle') }}</h4>
      <ul class="sources">
        <li v-for="s in sources" :id="`source-${s.id}`" :key="s.id">
          <span class="badge">{{ t(`science.badges.${s.badge}`) }}</span>
          <span class="source-id">[{{ s.id }}]</span>
          <a :href="s.url" target="_blank" rel="noopener">{{ s.title }}</a>
          <span v-if="s.journal && s.year" class="sub source-meta">
            {{ s.journal }}, {{ s.year }}
          </span>
        </li>
      </ul>
    </section>
    <ScrollToTopFab />
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
.formula .note {
  display: block;
  margin-top: 4px;
}
.sec p + p {
  margin-top: 12px;
}
.cite {
  font: 700 0.75rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  color: var(--accent);
  text-decoration: none;
}
.cite:hover {
  text-decoration: underline;
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
.source-id {
  font: 700 0.75rem/1 ui-monospace, 'SF Mono', Menlo, monospace;
  margin-right: 6px;
}
.source-meta {
  display: block;
  margin-top: 4px;
}
</style>
