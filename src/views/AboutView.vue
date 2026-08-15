<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { APP_VERSION } from '@/constants/app'
import { safeBack } from '@/utils/navigation'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div>
    <div class="subpage-head">
      <button type="button" class="btn ghost" @click="safeBack(router)">{{ t('common.back') }}</button>
      <header class="head">
        <div>
          <p class="kicker">{{ t('about.kicker') }}</p>
          <h1>{{ t('about.title') }}</h1>
        </div>
      </header>
    </div>
    <section class="panel">
      <p>{{ t('about.body') }}</p>
      <p class="sub">{{ t('about.version', { v: APP_VERSION }) }}</p>
      <button type="button" class="btn accent" @click="router.push('/why')">{{ t('about.whyLink') }}</button>
      <button type="button" class="btn" @click="router.push('/why#sources')">{{ t('about.sourcesLink') }}</button>
    </section>
  </div>
</template>
