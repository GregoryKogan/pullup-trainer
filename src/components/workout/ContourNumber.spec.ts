import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContourNumber from '@/components/workout/ContourNumber.vue'

describe('ContourNumber', () => {
  it('renders value as contour text', () => {
    const wrapper = mount(ContourNumber, { props: { value: 2 } })
    expect(wrapper.find('.contour-number').text()).toBe('2')
    expect(wrapper.find('.sr-only').text()).toBe('2')
  })

  it('renders multi-digit values', () => {
    const wrapper = mount(ContourNumber, { props: { value: 15 } })
    expect(wrapper.find('.contour-number').text()).toBe('15')
    expect(wrapper.find('.sr-only').text()).toBe('15')
  })

  it('mirrors full input in sr-only including non-digits', () => {
    const wrapper = mount(ContourNumber, { props: { value: '1x2' } })
    expect(wrapper.find('.contour-number').text()).toBe('1x2')
    expect(wrapper.find('.sr-only').text()).toBe('1x2')
  })
})
