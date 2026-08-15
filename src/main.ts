import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n, setLocale } from './i18n'
import { useSettingsStore } from './stores/settings'
import { useProgressStore } from './stores/progress'
import './assets/styles/main.css'

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
  if (settingsStore.settings?.language) {
    setLocale(settingsStore.settings.language)
  } else {
    document.documentElement.lang = 'en'
  }

  app.mount('#app')
}

bootstrap()
