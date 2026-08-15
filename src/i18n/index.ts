import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'
import enScience from './locales/science/en.json'
import ruScience from './locales/science/ru.json'

const messages = {
  en: { ...en, science: enScience },
  ru: { ...ru, science: ruScience },
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

export function setLocale(lang: 'en' | 'ru') {
  i18n.global.locale.value = lang
  document.documentElement.lang = lang
  document.title = i18n.global.t('common.appTitle')
}
