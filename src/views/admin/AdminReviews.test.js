/**
 * Tests for AdminReviews component
 * Feature: admin-panel
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminReviews from './AdminReviews.vue'
import * as fc from 'fast-check'
import api from '../../services/api.js'

// Mock the API module
vi.mock('../../services/api.js')

// Mock the composables
const mockAddNotification = vi.fn()
vi.mock('../../composables/useNotifications.js', () => ({
  useNotifications: () => ({
    addNotification: mockAddNotification,
    notifications: { value: [] }
  })
}))

// Helper to generate valid ISO date strings
const validDateArbitrary = () => 
  fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
    .map(timestamp => new Date(timestamp).toISOString())

// Helper to generate valid review data
const reviewArbitrary = () => 
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    user_id: fc.integer({ min: 1, max: 1000 }),
    product_id: fc.integer({ min: 1, max: 1000 }),
    rating: fc.integer({ min: 1, max: 5 }),
    comment: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
    created_at: validDateArbitrary(),
    user: fc.option(
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        email: fc.emailAddress(),
        is_active: fc.boolean(),
        is_staff: fc.boolean(),
        created_at: validDateArbitrary(),
        updated_at: validDateArbitrary()
      }),
      { nil: null }
    ),
    product: fc.option(
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
        price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => p.toFixed(2)),
        is_active: fc.boolean(),
        created_at: validDateArbitrary(),
        updated_at: validDateArbitrary()
      }),
      { nil: null }
    )
  })

describe('AdminReviews - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Unit Test: Review loading
   * Validates: Requirements 9.1
   * 
   * Test that reviews are loaded from API on component mount
   */
  it('should load reviews from API on mount', async () => {
    const mockReviews = [
      {
        id: 1,
        user_id: 1,
        product_id: 1,
        rating: 5,
        comment: 'Great product!',
        created_at: '2024-01-01T00:00:00Z',
        user: {
          id: 1,
          email: 'user@example.com',
          is_active: true,
          is_staff: false,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        product: {
          id: 1,
          title: 'Test Product',
          description: 'Test description',
          price: '99.99',
          is_active: true,
          created_at: '2023-06-01T00:00:00Z',
          updated_at: '2023-06-01T00:00:00Z'
        }
      },
      {
        id: 2,
        user_id: 2,
        product_id: 2,
        rating: 4,
        comment: null,
        created_at: '2024-01-02T00:00:00Z',
        user: null,
        product: null
      }
    ]

    api.getAllReviews.mockResolvedValue(mockReviews)

    const wrapper = mount(AdminReviews)
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify API was called with default pagination
    expect(api.getAllReviews).toHaveBeenCalledWith(0, 20)
    expect(api.getAllReviews).toHaveBeenCalledTimes(1)
    
    // Verify reviews are loaded
    expect(wrapper.vm.reviews).toEqual(mockReviews)
    expect(wrapper.vm.loading).toBe(false)
  })

  /**
   * Unit Test: Empty state display
   * Validates: Requirements 9.4
   * 
   * Test that empty state is displayed when no reviews exist
   */
  it('should display empty state when no reviews exist', async () => {
    api.getAllReviews.mockResolvedValue([])

    const wrapper = mount(AdminReviews)
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify empty state is displayed
    expect(wrapper.vm.reviews).toEqual([])
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Отзывы отсутствуют')
    expect(wrapper.text()).toContain('Пока нет отзывов от пользователей')
  })

  /**
   * Unit Test: Error handling on load
   * Validates: Requirements 9.4
   * 
   * Test that error notification is displayed when loading fails
   */
  it('should display error notification when loading reviews fails', async () => {
    const errorMessage = 'Network error'
    api.getAllReviews.mockRejectedValue(new Error(errorMessage))

    const wrapper = mount(AdminReviews)
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify error notification was called
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: expect.stringContaining('Ошибка при загрузке отзывов'),
      type: 'error'
    })
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: expect.stringContaining(errorMessage),
      type: 'error'
    })
    
    // Verify loading state is cleared
    expect(wrapper.vm.loading).toBe(false)
  })
})

describe('AdminReviews - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Feature: admin-panel, Property 17: Review display completeness
   * Validates: Requirements 9.2
   * 
   * For any set of reviews returned by the API, the system should display
   * all mandatory fields for each review: user name, product name, rating, comment, and creation date
   */
  it('Property 17: Review display completeness - for any set of reviews, all mandatory fields are displayed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(reviewArbitrary(), { minLength: 1, maxLength: 20 }),
        async (reviews) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API to return the generated reviews
          api.getAllReviews.mockResolvedValue(reviews)
          
          // Mount component
          const wrapper = mount(AdminReviews)
          
          // Wait for component to load data
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify all reviews are displayed
          expect(wrapper.vm.reviews).toEqual(reviews)
          
          // Verify each review displays all mandatory fields
          reviews.forEach(review => {
            // Check that user email is displayed (or placeholder for null)
            if (review.user) {
              expect(wrapper.text()).toContain(review.user.email)
            } else {
              expect(wrapper.text()).toContain('Неизвестный пользователь')
            }
            
            // Check that product name is displayed (or ID for null)
            if (review.product) {
              expect(wrapper.text()).toContain(review.product.title)
            } else {
              expect(wrapper.text()).toContain(`ID: ${review.product_id}`)
            }
            
            // Check that rating is displayed
            expect(wrapper.text()).toContain(`${review.rating}/5`)
            
            // Check that comment is displayed (or placeholder for null)
            if (review.comment) {
              expect(wrapper.text()).toContain(review.comment)
            } else {
              expect(wrapper.text()).toContain('Комментарий отсутствует')
            }
            
            // Check that created_at is formatted and displayed
            // The formatDate function formats dates in Russian locale
            // Format: "1 янв. 2020 г., 03:00" - we just check for presence of year
            const dateRegex = /\d{4}/
            expect(wrapper.text()).toMatch(dateRegex)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 18: Review pagination parameters
   * Validates: Requirements 9.3
   * 
   * For any values of skip and limit for reviews, the API call should pass
   * these parameters correctly in the query string
   */
  it('Property 18: Review pagination parameters - for any skip/limit values, API is called with correct parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        async (skip, limit) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getAllReviews.mockResolvedValue([])
          
          // Mount component
          const wrapper = mount(AdminReviews)
          await wrapper.vm.$nextTick()
          
          // Clear previous calls
          vi.clearAllMocks()
          
          // Set pagination values
          wrapper.vm.pagination.skip = skip
          wrapper.vm.pagination.limit = limit
          
          // Load reviews
          await wrapper.vm.loadReviews()
          await wrapper.vm.$nextTick()
          
          // Verify API was called with correct pagination parameters
          expect(api.getAllReviews).toHaveBeenCalledWith(skip, limit)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 19: Review deletion API call
   * Validates: Requirements 10.2
   * 
   * For any review with a valid ID, confirming deletion should call
   * the endpoint DELETE /api/store/reviews/{review_id} with the correct identifier
   */
  it('Property 19: Review deletion API call - for any review with valid ID, API is called with correct identifier', async () => {
    await fc.assert(
      fc.asyncProperty(
        reviewArbitrary(),
        async (review) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getAllReviews.mockResolvedValue([review])
          api.deleteReview.mockResolvedValue(true)
          
          // Mount component
          const wrapper = mount(AdminReviews)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Set the review to delete
          wrapper.vm.reviewToDelete = review
          
          // Call delete handler
          await wrapper.vm.handleDeleteReview()
          
          // Verify API was called with correct ID
          expect(api.deleteReview).toHaveBeenCalledWith(review.id)
          expect(api.deleteReview).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 20: Review list update after deletion
   * Validates: Requirements 10.3
   * 
   * For any successfully deleted review, it should disappear from
   * the displayed review list
   */
  it('Property 20: Review list update after deletion - for any deleted review, it disappears from the list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(reviewArbitrary(), { minLength: 1, maxLength: 20 })
          .chain(reviews => {
            // Ensure unique IDs
            const uniqueReviews = reviews.map((rev, idx) => ({ ...rev, id: idx + 1 }))
            return fc.constant(uniqueReviews)
          }),
        fc.integer({ min: 0, max: 19 }), // Index of review to delete
        async (reviews, deleteIndex) => {
          // Ensure deleteIndex is valid
          if (deleteIndex >= reviews.length) return
          
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          const reviewToDelete = reviews[deleteIndex]
          const remainingReviews = reviews.filter(r => r.id !== reviewToDelete.id)
          
          // Mock API responses
          api.getAllReviews
            .mockResolvedValueOnce(reviews) // Initial load
            .mockResolvedValueOnce(remainingReviews) // After deletion
          api.deleteReview.mockResolvedValue(true)
          
          // Mount component
          const wrapper = mount(AdminReviews)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify initial state
          const initialCount = wrapper.vm.reviews.length
          expect(initialCount).toBe(reviews.length)
          expect(wrapper.vm.reviews.find(r => r.id === reviewToDelete.id)).toBeDefined()
          
          // Set review to delete and delete it
          wrapper.vm.reviewToDelete = reviewToDelete
          await wrapper.vm.handleDeleteReview()
          await wrapper.vm.$nextTick()
          
          // Verify list was updated (loadReviews was called again)
          expect(api.getAllReviews).toHaveBeenCalledTimes(2)
          
          // Verify the review is no longer in the list
          expect(wrapper.vm.reviews.length).toBe(initialCount - 1)
          expect(wrapper.vm.reviews.find(r => r.id === reviewToDelete.id)).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
