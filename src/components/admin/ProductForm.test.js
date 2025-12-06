/**
 * Property-based tests for ProductForm component
 * Feature: admin-panel
 * Validates: Requirements 6.4
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductForm from './ProductForm.vue'
import * as fc from 'fast-check'

describe('ProductForm - Property-Based Tests', () => {
  /**
   * Feature: admin-panel, Property 12: Product form validation
   * Validates: Requirements 6.4
   * 
   * For any product form data where required fields (title, price, content) are
   * empty or invalid, the form should display corresponding validation messages
   * and disable submission
   */
  it('Property 12: Product form validation - for any invalid title (empty or >200 chars), form shows validation error', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Generate empty strings (including whitespace-only)
          fc.string().filter(s => s.trim().length === 0),
          // Generate strings longer than 200 characters
          fc.string({ minLength: 201, maxLength: 500 })
        ),
        (invalidTitle) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set the invalid title
          wrapper.vm.formData.title = invalidTitle
          
          // Trigger validation
          wrapper.vm.validateTitle()
          
          // Verify validation error is shown
          expect(wrapper.vm.errors.title).toBeTruthy()
          expect(wrapper.vm.errors.title.length).toBeGreaterThan(0)
          
          // Verify form is not valid (submit button should be disabled)
          expect(wrapper.vm.isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: Product form validation - for any invalid price (<=0 or non-numeric), form shows validation error', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Generate negative numbers
          fc.double({ max: 0 }),
          // Generate zero
          fc.constant(0),
          // Generate empty string
          fc.constant(''),
          // Generate non-numeric strings
          fc.string().filter(s => isNaN(parseFloat(s)))
        ),
        (invalidPrice) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set the invalid price
          wrapper.vm.formData.price = invalidPrice
          
          // Trigger validation
          wrapper.vm.validatePrice()
          
          // Verify validation error is shown
          expect(wrapper.vm.errors.price).toBeTruthy()
          expect(wrapper.vm.errors.price.length).toBeGreaterThan(0)
          
          // Verify form is not valid
          expect(wrapper.vm.isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: Product form validation - for any empty content, form shows validation error', () => {
    fc.assert(
      fc.property(
        // Generate empty strings (including whitespace-only)
        fc.string().filter(s => s.trim().length === 0),
        (emptyContent) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set the empty content
          wrapper.vm.formData.content_text = emptyContent
          
          // Trigger validation
          wrapper.vm.validateContent()
          
          // Verify validation error is shown
          expect(wrapper.vm.errors.content_text).toBeTruthy()
          expect(wrapper.vm.errors.content_text.length).toBeGreaterThan(0)
          
          // Verify form is not valid
          expect(wrapper.vm.isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property test: Valid product data
   * 
   * For any valid product data (title 1-200 chars, price > 0, non-empty content),
   * the form should be valid and allow submission
   */
  it('Property: Valid product data - for any valid inputs, form is valid and allows submission', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        async (validTitle, validPrice, validContent) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set valid data
          wrapper.vm.formData.title = validTitle
          wrapper.vm.formData.price = validPrice.toString()
          wrapper.vm.formData.content_text = validContent
          
          // Wait for reactivity
          await wrapper.vm.$nextTick()
          
          // Trigger validations
          wrapper.vm.validateTitle()
          wrapper.vm.validatePrice()
          wrapper.vm.validateContent()
          
          // Verify no validation errors
          expect(wrapper.vm.errors.title).toBe('')
          expect(wrapper.vm.errors.price).toBe('')
          expect(wrapper.vm.errors.content_text).toBe('')
          
          // Verify form is valid
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
   * For any valid product data, submitting the form should emit the submit event
   * with properly formatted data
   */
  it('Property: Form submission - for any valid data, submit emits event with correct format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
        fc.boolean(),
        (title, description, price, content, isActive) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set form data
          wrapper.vm.formData.title = title
          wrapper.vm.formData.description = description || ''
          wrapper.vm.formData.price = price.toString()
          wrapper.vm.formData.content_text = content
          wrapper.vm.formData.is_active = isActive
          
          // Submit the form
          wrapper.vm.handleSubmit()
          
          // Verify submit event was emitted
          expect(wrapper.emitted('submit')).toBeTruthy()
          expect(wrapper.emitted('submit').length).toBe(1)
          
          // Verify emitted data is properly formatted
          const emittedData = wrapper.emitted('submit')[0][0]
          expect(emittedData.title).toBe(title.trim())
          expect(emittedData.price).toBe(price)
          expect(emittedData.content_text).toBe(content.trim())
          expect(emittedData.is_active).toBe(isActive)
          
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
   * Property test: Validation error messages for empty title
   */
  it('Property: Empty title validation - for any empty/whitespace string, error indicates field is required', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length === 0),
        (emptyTitle) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set empty title
          wrapper.vm.formData.title = emptyTitle
          
          // Trigger validation
          wrapper.vm.validateTitle()
          
          // Verify error message indicates field is required
          expect(wrapper.vm.errors.title).toContain('обязательно')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test: Validation error messages for long titles
   */
  it('Property: Long title validation - for any string >200 chars, error indicates max length exceeded', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 201, maxLength: 500 }).filter(s => s.trim().length > 200),
        (longTitle) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set long title
          wrapper.vm.formData.title = longTitle
          
          // Trigger validation
          wrapper.vm.validateTitle()
          
          // Verify error message indicates max length
          expect(wrapper.vm.errors.title).toContain('200')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test: Validation error messages for invalid price
   */
  it('Property: Price validation - for any price <=0, error indicates price must be positive', () => {
    fc.assert(
      fc.property(
        fc.double({ max: 0 }).filter(n => !isNaN(n)),
        (invalidPrice) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set invalid price
          wrapper.vm.formData.price = invalidPrice.toString()
          
          // Trigger validation
          wrapper.vm.validatePrice()
          
          // Verify error message indicates price must be positive
          expect(wrapper.vm.errors.price).toContain('больше нуля')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test: Validation error messages for empty content
   */
  it('Property: Empty content validation - for any empty/whitespace string, error indicates field is required', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length === 0),
        (emptyContent) => {
          const wrapper = mount(ProductForm, {
            props: {
              categories: []
            }
          })
          
          // Set empty content
          wrapper.vm.formData.content_text = emptyContent
          
          // Trigger validation
          wrapper.vm.validateContent()
          
          // Verify error message indicates field is required
          expect(wrapper.vm.errors.content_text).toContain('обязателен')
        }
      ),
      { numRuns: 100 }
    )
  })
})
