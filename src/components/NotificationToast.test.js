/**
 * Unit tests for NotificationToast component
 * Requirements: 12.1, 12.2, 12.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationToast from './NotificationToast.vue'

describe('NotificationToast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  /**
   * Test rendering with different types
   * Requirements: 12.1, 12.2
   */
  describe('Rendering with different types', () => {
    it('should render success notification with correct styling', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Operation successful',
          type: 'success',
          duration: 3000
        }
      })

      expect(wrapper.find('.notification-toast').exists()).toBe(true)
      expect(wrapper.find('.toast-success').exists()).toBe(true)
      expect(wrapper.find('.toast-message').text()).toBe('Operation successful')
      expect(wrapper.find('.toast-icon').text()).toBe('✓')
    })

    it('should render error notification with correct styling', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'An error occurred',
          type: 'error',
          duration: 5000
        }
      })

      expect(wrapper.find('.notification-toast').exists()).toBe(true)
      expect(wrapper.find('.toast-error').exists()).toBe(true)
      expect(wrapper.find('.toast-message').text()).toBe('An error occurred')
      expect(wrapper.find('.toast-icon').text()).toBe('✕')
    })

    it('should render info notification with correct styling', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Information message',
          type: 'info',
          duration: 3000
        }
      })

      expect(wrapper.find('.notification-toast').exists()).toBe(true)
      expect(wrapper.find('.toast-info').exists()).toBe(true)
      expect(wrapper.find('.toast-message').text()).toBe('Information message')
      expect(wrapper.find('.toast-icon').text()).toBe('ℹ')
    })

    it('should default to info type when type is not specified', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Default notification'
        }
      })

      expect(wrapper.find('.toast-info').exists()).toBe(true)
    })
  })

  /**
   * Test auto-close functionality
   * Requirement 12.1: Auto-close after specified duration
   */
  describe('Auto-close functionality', () => {
    it('should auto-close after specified duration', async () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Auto-close test',
          type: 'success',
          duration: 3000
        }
      })

      // Initially visible
      expect(wrapper.find('.notification-toast').exists()).toBe(true)

      // Advance timers by 3 seconds + animation delay
      await vi.advanceTimersByTimeAsync(3000)
      await wrapper.vm.$nextTick()
      await vi.advanceTimersByTimeAsync(300)
      await wrapper.vm.$nextTick()

      // Should emit close event
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not auto-close when duration is 0', async () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'No auto-close',
          type: 'info',
          duration: 0
        }
      })

      // Initially visible
      expect(wrapper.find('.notification-toast').exists()).toBe(true)

      // Advance timers significantly
      await vi.advanceTimersByTimeAsync(10000)
      await wrapper.vm.$nextTick()

      // Should not emit close event
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('should auto-close success notifications after 3 seconds by default', async () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Success message',
          type: 'success',
          duration: 3000
        }
      })

      expect(wrapper.find('.notification-toast').exists()).toBe(true)

      await vi.advanceTimersByTimeAsync(3000)
      await wrapper.vm.$nextTick()
      await vi.advanceTimersByTimeAsync(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  /**
   * Test click to close functionality
   * Requirement 12.4: Close notification on click
   */
  describe('Click to close functionality', () => {
    it('should close when clicking on the notification body', async () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Click to close',
          type: 'info',
          duration: 5000
        }
      })

      // Click on the notification
      await wrapper.find('.notification-toast').trigger('click')
      await wrapper.vm.$nextTick()
      
      // Wait for animation delay
      await vi.advanceTimersByTimeAsync(300)
      await wrapper.vm.$nextTick()

      // Should emit close event
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should close when clicking the close button', async () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Close button test',
          type: 'success',
          duration: 5000
        }
      })

      // Click on the close button
      await wrapper.find('.toast-close').trigger('click')
      await wrapper.vm.$nextTick()
      
      // Wait for animation delay
      await vi.advanceTimersByTimeAsync(300)
      await wrapper.vm.$nextTick()

      // Should emit close event
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit close event only once when clicked', async () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Single close test',
          type: 'info',
          duration: 5000
        }
      })

      await wrapper.find('.notification-toast').trigger('click')
      await wrapper.vm.$nextTick()

      // Wait for animation
      await vi.advanceTimersByTimeAsync(300)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close').length).toBe(1)
    })
  })

  /**
   * Test accessibility features
   */
  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error notifications', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Error message',
          type: 'error',
          duration: 5000
        }
      })

      const toast = wrapper.find('.notification-toast')
      expect(toast.attributes('role')).toBe('alert')
      expect(toast.attributes('aria-live')).toBe('assertive')
    })

    it('should have proper ARIA attributes for non-error notifications', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Info message',
          type: 'info',
          duration: 3000
        }
      })

      const toast = wrapper.find('.notification-toast')
      expect(toast.attributes('role')).toBe('alert')
      expect(toast.attributes('aria-live')).toBe('polite')
    })

    it('should have aria-label on close button', () => {
      const wrapper = mount(NotificationToast, {
        props: {
          message: 'Test message',
          type: 'success',
          duration: 3000
        }
      })

      const closeButton = wrapper.find('.toast-close')
      expect(closeButton.attributes('aria-label')).toBe('Закрыть уведомление')
    })
  })
})
