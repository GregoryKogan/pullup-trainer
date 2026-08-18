import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContourNumber from '@/components/workout/ContourNumber.vue'
import { CONTOUR_DIGITS, DIGIT_HEIGHT } from '@/components/workout/contour-digit-paths'

describe('ContourNumber', () => {
  it('renders value as svg stroke paths', () => {
    const wrapper = mount(ContourNumber, { props: { value: 2 } })
    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(1)
    expect(paths[0]!.attributes('d')).toBe(CONTOUR_DIGITS['2']!.d)
    expect(paths[0]!.attributes('stroke-linejoin')).toBe('round')
    expect(paths[0]!.attributes('vector-effect')).toBe('non-scaling-stroke')
    expect(wrapper.find('.sr-only').text()).toBe('2')
  })

  it('widens viewBox for multi-digit values', () => {
    const wrapper = mount(ContourNumber, { props: { value: 15 } })
    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(2)
    const viewBox = wrapper.find('svg').attributes('viewBox')!
    const width = Number(viewBox.split(' ')[2])
    const expectedWidth = CONTOUR_DIGITS['1']!.width + CONTOUR_DIGITS['5']!.width + 6
    expect(width).toBe(Math.max(100, Math.ceil(expectedWidth)))
    expect(viewBox).toBe(`0 0 ${width} ${DIGIT_HEIGHT}`)
  })

  it('ignores non-digit characters', () => {
    const wrapper = mount(ContourNumber, { props: { value: '1x2' } })
    expect(wrapper.findAll('path')).toHaveLength(2)
    expect(wrapper.find('.sr-only').text()).toBe('1x2')
  })
})
