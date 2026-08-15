<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div>
    <header class="head">
      <div>
        <p class="kicker">{{ t('about.kicker') }}</p>
        <h2>{{ t('about.title') }}</h2>
      </div>
    </header>
    <section class="panel">
      <p>{{ t('about.body') }}</p>
      <p class="sub">{{ t('about.version', { v: '1.0.0' }) }}</p>
      <button type="button" class="btn accent" @click="router.push('/why')">{{ t('about.whyLink') }}</button>
      <button type="button" class="btn" @click="router.push('/why#sources')">{{ t('about.sourcesLink') }}</button>
      <button type="button" class="btn ghost" @click="router.back()">{{ t('common.back') }}</button>
    </section>
  </div>
</template>
