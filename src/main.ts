import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useSettingsStore } from './stores/settings'
import { useProgressStore } from './stores/progress'
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

  app.mount('#app')
}

bootstrap()
