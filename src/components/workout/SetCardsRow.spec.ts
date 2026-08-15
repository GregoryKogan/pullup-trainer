import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SetCardsRow from '@/components/workout/SetCardsRow.vue'

describe('SetCardsRow', () => {
  it('renders set states', () => {
    const wrapper = mount(SetCardsRow, {
      props: {
        sets: [
          { planned: 5, doneFlag: true, done: 5 },
          { planned: 5, current: true },
          { planned: 5 },
        ],
      },
    })
    expect(wrapper.findAll('.s')).toHaveLength(3)
    expect(wrapper.find('.s.done').exists()).toBe(true)
    expect(wrapper.find('.s.now').exists()).toBe(true)
  })
})
