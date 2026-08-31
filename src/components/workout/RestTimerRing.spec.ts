import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RestTimerRing from '@/components/workout/RestTimerRing.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      workout: {
        reset: 'Reset',
        chooseRest: 'Pick duration',
        skipRest: 'Skip',
        restHint: 'hint',
        adjustMinus: '−15 sec',
        adjustPlus: '+15 sec',
        adjustStep: '15 sec',
      },
    },
  },
})

describe('RestTimerRing', () => {
  it('shows preset labels in m:ss format', () => {
    const wrapper = mount(RestTimerRing, {
      global: { plugins: [i18n] },
      props: { remaining: 90, total: 180, label: 'REST' },
    })
    const presetLabels = wrapper.findAll('.presets .mini').map((btn) => btn.text())
    expect(presetLabels).toEqual(['1:30', '3:00', '5:00'])
  })

  it('emits adjust events', async () => {
    const wrapper = mount(RestTimerRing, {
      global: { plugins: [i18n] },
      props: { remaining: 90, total: 180, label: 'REST' },
    })
    await wrapper.findAll('.mini')[3].trigger('click')
    expect(wrapper.emitted('minus')).toBeTruthy()
  })

  it('disables minus at minimum and plus at maximum', () => {
    const atMin = mount(RestTimerRing, {
      global: { plugins: [i18n] },
      props: { remaining: 0, total: 180, label: 'REST', minSeconds: 0, maxSeconds: 300 },
    })
    const atMax = mount(RestTimerRing, {
      global: { plugins: [i18n] },
      props: { remaining: 300, total: 300, label: 'REST', minSeconds: 0, maxSeconds: 300 },
    })
    expect(atMin.findAll('.mini')[3].attributes('disabled')).toBeDefined()
    expect(atMax.findAll('.mini')[4].attributes('disabled')).toBeDefined()
  })
})
