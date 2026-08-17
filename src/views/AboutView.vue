<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { APP_VERSION } from '@/constants/app'
import AppIcon from '@/components/icons/AppIcon.vue'
import IconMark from '@/components/icons/brand/IconMark.vue'
import { safeBack } from '@/utils/navigation'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="page">
    <div class="subpage-head">
      <header class="head">
        <div>
          <p class="kicker">{{ t('about.kicker') }}</p>
          <h1>{{ t('about.title') }}</h1>
        </div>
      </header>
      <button type="button" class="btn ghost" @click="safeBack(router)">
        <AppIcon name="chev-left" />
        {{ t('common.back') }}
      </button>
      <div class="about-mark-wrap">
        <IconMark :size="88" class="about-mark" />
      </div>
    </div>
    <section class="panel">
      <p>{{ t('about.body') }}</p>
      <p class="sub">{{ t('about.version', { v: APP_VERSION }) }}</p>
      <p class="sub">
        <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer">{{ t('about.iconsCredit') }}</a>
      </p>
      <RouterLink to="/why" class="btn accent">{{ t('about.whyLink') }}</RouterLink>
      <RouterLink to="/why#sources" class="btn">{{ t('about.sourcesLink') }}</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.about-mark-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}
.about-mark {
  color: var(--accent);
}
</style>
