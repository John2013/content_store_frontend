/**
 * Unit tests for ConfirmDialog component
 * Requirements: 4.1, 8.1, 10.1
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog Component', () => {
  /**
   * Test rendering with different props
   * Requirement 4.1: Customizable text
   */
  describe('Rendering with different props', () => {
    it('should render dialog with custom title and message', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Delete Category',
          message: 'Are you sure you want to delete this category?',
          modelValue: true
        }
      })

      expect(wrapper.find('.dialog-title').text()).toBe('Delete Category')
      expect(wrapper.find('.dialog-message').text()).toBe('Are you sure you want to delete this category?')
      expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
    })

    it('should render with default button texts', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm Action',
          message: 'Please confirm',
          modelValue: true
        }
      })

      expect(wrapper.find('.dialog-btn-confirm').text()).toBe('Подтвердить')
      expect(wrapper.find('.dialog-btn-cancel').text()).toBe('Отмена')
    })

    it('should render with custom button texts', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Delete Item',
          message: 'This action cannot be undone',
          confirmText: 'Delete',
          cancelText: 'Keep',
          modelValue: true
        }
      })

      expect(wrapper.find('.dialog-btn-confirm').text()).toBe('Delete')
      expect(wrapper.find('.dialog-btn-cancel').text()).toBe('Keep')
    })

    it('should not render when modelValue is false', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Test Dialog',
          message: 'Test message',
          modelValue: false
        }
      })

      expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    })

    it('should render when modelValue is true', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Test Dialog',
          message: 'Test message',
          modelValue: true
        }
      })

      expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
      expect(wrapper.find('.dialog-container').exists()).toBe(true)
    })
  })

  /**
   * Test event emits
   * Requirement 4.1: Emit confirm and cancel events
   */
  describe('Event emits', () => {
    it('should emit confirm event when confirm button is clicked', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-btn-confirm').trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm').length).toBe(1)
    })

    it('should emit cancel event when cancel button is clicked', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-btn-cancel').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel').length).toBe(1)
    })

    it('should emit update:modelValue with false when confirm is clicked', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-btn-confirm').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('should emit update:modelValue with false when cancel is clicked', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-btn-cancel').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
    })

    it('should emit cancel event when close button is clicked', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-close-btn').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel').length).toBe(1)
    })

    it('should emit cancel event when overlay is clicked', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-overlay').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel').length).toBe(1)
    })

    it('should not emit cancel when clicking inside dialog container', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      await wrapper.find('.dialog-container').trigger('click')

      expect(wrapper.emitted('cancel')).toBeFalsy()
    })
  })

  /**
   * Test accessibility features
   */
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Delete Item',
          message: 'This will permanently delete the item',
          modelValue: true
        }
      })

      const overlay = wrapper.find('.dialog-overlay')
      expect(overlay.attributes('role')).toBe('dialog')
      expect(overlay.attributes('aria-modal')).toBe('true')
      expect(overlay.attributes('aria-labelledby')).toBeTruthy()
      expect(overlay.attributes('aria-describedby')).toBeTruthy()
    })

    it('should have aria-label on close button', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Confirm',
          message: 'Are you sure?',
          modelValue: true
        }
      })

      const closeButton = wrapper.find('.dialog-close-btn')
      expect(closeButton.attributes('aria-label')).toBe('Закрыть диалог')
    })

    it('should have unique IDs for title and message', () => {
      const wrapper1 = mount(ConfirmDialog, {
        props: {
          title: 'Dialog 1',
          message: 'Message 1',
          modelValue: true
        }
      })

      const wrapper2 = mount(ConfirmDialog, {
        props: {
          title: 'Dialog 2',
          message: 'Message 2',
          modelValue: true
        }
      })

      const titleId1 = wrapper1.find('.dialog-title').attributes('id')
      const titleId2 = wrapper2.find('.dialog-title').attributes('id')

      expect(titleId1).toBeTruthy()
      expect(titleId2).toBeTruthy()
      expect(titleId1).not.toBe(titleId2)
    })
  })

  /**
   * Test keyboard interactions
   */
  describe('Keyboard interactions', () => {
    beforeEach(() => {
      // Mock document event listeners
      vi.spyOn(document, 'addEventListener')
      vi.spyOn(document, 'removeEventListener')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should add escape key listener on mount', () => {
      mount(ConfirmDialog, {
        props: {
          title: 'Test',
          message: 'Test message',
          modelValue: true
        }
      })

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should remove escape key listener on unmount', () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          title: 'Test',
          message: 'Test message',
          modelValue: true
        }
      })

      wrapper.unmount()

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
