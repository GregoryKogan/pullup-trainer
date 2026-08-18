import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContourNumber from '@/components/workout/ContourNumber.vue'

const VIEWBOX_PAD = 4
const MIN_INNER_WIDTH = 100
const VIEW_HEIGHT = 100

function expectedEstimate(value: string) {
  const chars = value.replace(/\D/g, '').length || value.length || 1
  const innerWidth = Math.max(MIN_INNER_WIDTH, chars * 52)
  const viewWidth = innerWidth + VIEWBOX_PAD * 2
  const viewHeight = VIEW_HEIGHT + VIEWBOX_PAD * 2
  return {
    viewBox: `-${VIEWBOX_PAD} -${VIEWBOX_PAD} ${viewWidth} ${viewHeight}`,
    ratio: viewWidth / viewHeight,
  }
}

describe('ContourNumber', () => {
  it('renders value as stroked svg text', () => {
    const wrapper = mount(ContourNumber, { props: { value: 2 } })
    const label = wrapper.find('.contour-number-text')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('2')
    expect(label.attributes('stroke-linejoin')).toBe('round')
    expect(label.attributes('stroke-width')).toBe('2.5')
    expect(wrapper.find('.sr-only').text()).toBe('2')
  })

  it('uses estimated padded viewBox before measurement', () => {
    const wrapper = mount(ContourNumber, { props: { value: 15 } })
    const svg = wrapper.find('svg')
    const expected = expectedEstimate('15')
    expect(svg.attributes('viewBox')).toBe(expected.viewBox)
    expect(svg.attributes('preserveAspectRatio')).toBe('xMidYMid meet')
  })

  it('uses explicit inline width for two-digit values', () => {
    for (const value of [17, 33]) {
      const wrapper = mount(ContourNumber, { props: { value } })
      const svg = wrapper.find('svg')
      const expected = expectedEstimate(String(value))
      expect(svg.attributes('viewBox')).toBe(expected.viewBox)
      expect(svg.attributes('style')).toContain('min(100%')
      expect(svg.attributes('style')).toContain('height: 1em')
      expect(svg.attributes('style')).not.toContain('aspect-ratio')
    }
  })

  it('renders digits and ignores non-digit characters in svg text', () => {
    const wrapper = mount(ContourNumber, { props: { value: '1x2' } })
    expect(wrapper.find('.contour-number-text').text()).toBe('1x2')
    expect(wrapper.find('.sr-only').text()).toBe('1x2')
  })
})
