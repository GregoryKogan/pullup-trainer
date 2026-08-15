<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { APP_VERSION } from '@/constants/app'
import AppIcon from '@/components/icons/AppIcon.vue'
import { safeBack } from '@/utils/navigation'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="page">
    <div class="subpage-head">
      <button type="button" class="btn ghost" @click="safeBack(router)">
        <AppIcon name="chev-left" />
        {{ t('common.back') }}
      </button>
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
      <RouterLink to="/why" class="btn accent">{{ t('about.whyLink') }}</RouterLink>
      <RouterLink to="/why#sources" class="btn">{{ t('about.sourcesLink') }}</RouterLink>
    </section>
  </div>
</template>
