import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ConfirmPanel from '@/components/ConfirmPanel.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
      },
    },
  },
})

describe('ConfirmPanel', () => {
  it('uses custom title when provided', () => {
    const wrapper = mount(ConfirmPanel, {
      attachTo: document.body,
      global: { plugins: [i18n] },
      props: {
        visible: true,
        title: 'Start early?',
        message: 'Start this workout before its scheduled day?',
      },
    })
    expect(document.querySelector('#confirm-title')?.textContent).toBe('Start early?')
    expect(document.querySelector('#confirm-desc')?.textContent).toBe(
      'Start this workout before its scheduled day?',
    )
    wrapper.unmount()
  })

  it('falls back to default confirm label as title', () => {
    const wrapper = mount(ConfirmPanel, {
      attachTo: document.body,
      global: { plugins: [i18n] },
      props: {
        visible: true,
        message: 'Are you sure?',
      },
    })
    expect(document.querySelector('#confirm-title')?.textContent).toBe('Confirm')
    wrapper.unmount()
  })

  it('emits confirm and cancel', async () => {
    const wrapper = mount(ConfirmPanel, {
      attachTo: document.body,
      global: { plugins: [i18n] },
      props: {
        visible: true,
        message: 'Delete?',
      },
    })
    const confirmBtn = document.querySelector('[data-modal-primary]') as HTMLButtonElement
    const cancelBtn = document.querySelector('.confirm-panel .btn.ghost') as HTMLButtonElement
    confirmBtn.click()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    cancelBtn.click()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })
})
