import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import CrossFader from '../CrossFader.vue'

describe('CrossFader', () => {
  it('renders properly', () => {
    const wrapper = mount(CrossFader)
    expect(wrapper.text()).toContain('Track #1')
    expect(wrapper.vm.$data.volume).toBe(0.75) // Check if the volume is set correctly
  })
  it('changes volume when the slider changes', async () => {
    const wrapper = mount(CrossFader)
     //Test if volume changes correctly by modifying the volume slider.
     const volumeSlider = wrapper.find('input[type="range"]')
     expect(volumeSlider.element.value).toBe('0.75')
     await volumeSlider.setValue('0.5')
     expect(volumeSlider.element.value).toBe('0.5')
  })
})
