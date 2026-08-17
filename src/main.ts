import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n, setLocale } from './i18n'
import { useSettingsStore } from './stores/settings'
import { useProgressStore } from './stores/progress'
import { APP_SHORT_NAME } from '@/constants/app-brand'
import { syncAppBranding } from '@/utils/app-branding'
import './assets/styles/main.css'
import { installZoomPrevention } from '@/utils/prevent-zoom'

installZoomPrevention()

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(i18n)

  const settingsStore = useSettingsStore()
  const progressStore = useProgressStore()
  await settingsStore.hydrate()
  await progressStore.hydrate()
  const { ensureAppMeta } = await import('./db/repositories/app-meta')
  await ensureAppMeta()
  if (settingsStore.settings?.language) {
    setLocale(settingsStore.settings.language)
  } else {
    document.documentElement.lang = 'en'
    syncAppBranding(i18n.global.t('common.appTitle'), APP_SHORT_NAME)
  }

  app.mount('#app')
}

bootstrap()
