/**
 * Property-based tests for CategoryForm component
 * Feature: admin-panel
 * Validates: Requirements 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryForm from './CategoryForm.vue'
import * as fc from 'fast-check'

describe('CategoryForm - Property-Based Tests', () => {
  /**
   * Feature: admin-panel, Property 4: Category name validation
   * Validates: Requirements 3.4
   * 
   * For any string that is empty or exceeds 100 characters, the form should
   * display a validation message and not allow submission (submit button disabled)
   */
  it('Property 4: Category name validation - for any invalid name (empty or >100 chars), form shows validation error and disables submit', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Generate empty strings (including whitespace-only)
          fc.string().filter(s => s.trim().length === 0),
          // Generate strings longer than 100 characters
          fc.string({ minLength: 101, maxLength: 500 })
        ),
        (invalidName) => {
          const wrapper = mount(CategoryForm)
          
          // Set the invalid name
          wrapper.vm.formData.name = invalidName
          
          // Trigger validation
          wrapper.vm.validateName()
          
          // Verify validation error is shown
          expect(wrapper.vm.errors.name).toBeTruthy()
          expect(wrapper.vm.errors.name.length).toBeGreaterThan(0)
          
          // Verify form is not valid (submit button should be disabled)
          expect(wrapper.vm.isValid).toBe(false)
          
          // Verify the submit button is disabled
          const submitButton = wrapper.find('button[type="submit"]')
          expect(submitButton.attributes('disabled')).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property test: Valid category names
   * 
   * For any string with length 1-100 characters (after trimming), the form should
   * be valid and allow submission
   */
  it('Property: Valid category names - for any name with 1-100 chars, form is valid and allows submission', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (validName) => {
          const wrapper = mount(CategoryForm)
          
          // Set the valid name
          wrapper.vm.formData.name = validName
          
          // Wait for reactivity to complete
          await wrapper.vm.$nextTick()
          
          // Trigger validation
          const isValid = wrapper.vm.validateName()
          
          // Verify no validation error
          expect(wrapper.vm.errors.name).toBe('')
          expect(isValid).toBe(true)
          
          // Verify form is valid (submit button should be enabled)
          expect(wrapper.vm.isValid).toBe(true)
          
          // Wait for DOM update
          await wrapper.vm.$nextTick()
          
          // Verify the submit button is not disabled
          const submitButton = wrapper.find('button[type="submit"]')
          const disabledAttr = submitButton.attributes('disabled')
          expect(disabledAttr === undefined || disabledAttr === false).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test: Form submission with valid data
   * 
   * For any valid category name, submitting the form should emit the submit event
   * with trimmed data
   */
  it('Property: Form submission - for any valid name, submit emits event with trimmed data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        (name, description) => {
          const wrapper = mount(CategoryForm)
          
          // Set form data
          wrapper.vm.formData.name = name
          wrapper.vm.formData.description = description || ''
          
          // Submit the form
          wrapper.vm.handleSubmit()
          
          // Verify submit event was emitted
          expect(wrapper.emitted('submit')).toBeTruthy()
          expect(wrapper.emitted('submit').length).toBe(1)
          
          // Verify emitted data is trimmed
          const emittedData = wrapper.emitted('submit')[0][0]
          expect(emittedData.name).toBe(name.trim())
          
          // Description should be undefined if empty, otherwise trimmed
          if (description && description.trim().length > 0) {
            expect(emittedData.description).toBe(description.trim())
          } else {
            expect(emittedData.description).toBeUndefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test: Validation error messages
   * 
   * For any empty string (after trimming), the error message should indicate
   * the field is required
   */
  it('Property: Empty name validation - for any empty/whitespace string, error indicates field is required', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length === 0),
        (emptyName) => {
          const wrapper = mount(CategoryForm)
          
          // Set empty name
          wrapper.vm.formData.name = emptyName
          
          // Trigger validation
          wrapper.vm.validateName()
          
          // Verify error message indicates field is required
          expect(wrapper.vm.errors.name).toContain('обязательно')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test: Validation error messages for long names
   * 
   * For any string longer than 100 characters, the error message should indicate
   * the maximum length constraint
   */
  it('Property: Long name validation - for any string >100 chars, error indicates max length exceeded', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 500 }),
        (longName) => {
          const wrapper = mount(CategoryForm)
          
          // Set long name
          wrapper.vm.formData.name = longName
          
          // Trigger validation
          wrapper.vm.validateName()
          
          // Verify error message indicates max length
          expect(wrapper.vm.errors.name).toContain('100')
        }
      ),
      { numRuns: 100 }
    )
  })
})
