import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'
import enScience from './locales/science/en.json'
import ruScience from './locales/science/ru.json'
import { APP_SHORT_NAME } from '@/constants/app-brand'
import { syncAppBranding } from '@/utils/app-branding'

function russianPluralRule(choice: number, choicesLength: number): number {
  if (choice === 0) return 0
  const teen = choice % 100 > 10 && choice % 100 < 20
  const lastDigit = choice % 10
  if (!teen && lastDigit === 1) return 1
  if (!teen && lastDigit >= 2 && lastDigit <= 4) return 2
  return choicesLength < 4 ? 2 : 3
}

const messages = {
  en: { ...en, science: enScience },
  ru: { ...ru, science: ruScience },
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
  pluralRules: {
    ru: russianPluralRule,
  },
})

export function setLocale(lang: 'en' | 'ru') {
  i18n.global.locale.value = lang
  document.documentElement.lang = lang
  syncAppBranding(i18n.global.t('common.appTitle'), APP_SHORT_NAME)
}
