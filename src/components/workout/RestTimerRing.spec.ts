import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RestTimerRing from '@/components/workout/RestTimerRing.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: { workout: { reset: 'Reset', skipRest: 'Skip', restHint: 'hint' } } } })

describe('RestTimerRing', () => {
  it('emits adjust events', async () => {
    const wrapper = mount(RestTimerRing, {
      global: { plugins: [i18n] },
      props: { remaining: 90, total: 180, label: 'REST' },
    })
    await wrapper.findAll('.mini')[0].trigger('click')
    expect(wrapper.emitted('minus')).toBeTruthy()
  })
})
