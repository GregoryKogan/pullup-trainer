import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContourNumber from '@/components/workout/ContourNumber.vue'

describe('ContourNumber', () => {
  it('renders value as svg stroke text', () => {
    const wrapper = mount(ContourNumber, { props: { value: 2 } })
    expect(wrapper.find('text').text()).toBe('2')
    expect(wrapper.find('text').attributes('stroke-linejoin')).toBe('round')
    expect(wrapper.find('.sr-only').text()).toBe('2')
  })

  it('widens viewBox for multi-digit values', () => {
    const wrapper = mount(ContourNumber, { props: { value: 15 } })
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 136 100')
  })
})
