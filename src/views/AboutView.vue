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
      <ul class="about-links">
        <li>
          <a
            href="https://github.com/GregoryKogan/pullup-trainer"
            class="about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="github" />
            {{ t('about.repo') }}
          </a>
        </li>
        <li>
          <RouterLink to="/why" class="btn accent">
            <AppIcon name="book-open" />
            {{ t('about.whyLink') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/why#sources" class="btn">
            <AppIcon name="library" />
            {{ t('about.sourcesLink') }}
          </RouterLink>
        </li>
        <li>
          <a
            href="https://lucide.dev"
            class="about-link about-link-muted"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="external-link" />
            {{ t('about.iconsCredit') }}
          </a>
        </li>
      </ul>
    </section>
    <section class="panel about-contacts">
      <h2>{{ t('about.contactsTitle') }}</h2>
      <p class="about-author">{{ t('about.authorName') }}</p>
      <ul class="about-contact-list">
        <li>
          <a href="mailto:g.koganovsky@gmail.com" class="about-link">
            <AppIcon name="mail" />
            g.koganovsky@gmail.com
          </a>
        </li>
        <li>
          <a
            href="https://t.me/GregoryKogan"
            class="about-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="telegram" />
            @GregoryKogan
          </a>
        </li>
      </ul>
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
.about-links,
.about-contact-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}
.about-links li + li,
.about-contact-list li + li {
  margin-top: 8px;
}
.about-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
}
.about-link svg {
  flex-shrink: 0;
  color: var(--accent);
}
.about-link-muted {
  font-weight: 600;
  color: var(--muted);
  font-size: 0.88rem;
}
.about-link-muted svg {
  color: var(--muted);
}
.about-contacts {
  margin-top: 12px;
}
.about-contacts h2 {
  font: 800 0.95rem/1.2 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  margin: 0 0 10px;
  border-bottom: 3px solid var(--line);
  padding-bottom: 6px;
}
.about-author {
  font-weight: 800;
  margin: 0 0 8px;
}
</style>
