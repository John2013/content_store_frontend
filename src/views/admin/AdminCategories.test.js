/**
 * Tests for AdminCategories component
 * Feature: admin-panel
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.2, 3.3, 4.2, 4.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminCategories from './AdminCategories.vue'
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

describe('AdminCategories - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Unit Test: Category loading
   * Validates: Requirements 2.1
   * 
   * Test that categories are loaded from API on component mount
   */
  it('should load categories from API on mount', async () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Test Category 1',
        description: 'Description 1',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Test Category 2',
        description: null,
        created_at: '2024-01-02T00:00:00Z'
      }
    ]

    api.getCategories.mockResolvedValue(mockCategories)

    const wrapper = mount(AdminCategories)
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify API was called
    expect(api.getCategories).toHaveBeenCalledTimes(1)
    
    // Verify categories are loaded
    expect(wrapper.vm.categories).toEqual(mockCategories)
    expect(wrapper.vm.loading).toBe(false)
  })

  /**
   * Unit Test: Empty state display
   * Validates: Requirements 2.3
   * 
   * Test that empty state is displayed when no categories exist
   */
  it('should display empty state when no categories exist', async () => {
    api.getCategories.mockResolvedValue([])

    const wrapper = mount(AdminCategories)
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify empty state is displayed
    expect(wrapper.vm.categories).toEqual([])
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Категории отсутствуют')
    expect(wrapper.text()).toContain('Создайте первую категорию для организации товаров')
  })

  /**
   * Unit Test: Error handling on load
   * Validates: Requirements 2.4
   * 
   * Test that error notification is displayed when loading fails
   */
  it('should display error notification when loading categories fails', async () => {
    const errorMessage = 'Network error'
    api.getCategories.mockRejectedValue(new Error(errorMessage))

    const wrapper = mount(AdminCategories)
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify error notification was called
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: expect.stringContaining('Ошибка при загрузке категорий'),
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

describe('AdminCategories - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Feature: admin-panel, Property 1: Category display completeness
   * Validates: Requirements 2.2
   * 
   * For any set of categories returned by the API, the system should display
   * all mandatory fields for each category: name, description, and creation date
   */
  it('Property 1: Category display completeness - for any set of categories, all mandatory fields are displayed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            created_at: validDateArbitrary()
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (categories) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API to return the generated categories
          api.getCategories.mockResolvedValue(categories)
          
          // Mount component
          const wrapper = mount(AdminCategories)
          
          // Wait for component to load data
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify all categories are displayed
          expect(wrapper.vm.categories).toEqual(categories)
          
          // Verify each category displays all mandatory fields
          categories.forEach(category => {
            // Check that category name is displayed
            expect(wrapper.text()).toContain(category.name)
            
            // Check that description is displayed (or placeholder for null)
            if (category.description) {
              expect(wrapper.text()).toContain(category.description)
            } else {
              expect(wrapper.text()).toContain('Описание отсутствует')
            }
            
            // Check that created_at is formatted and displayed
            expect(wrapper.text()).toContain('Создано:')
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 2: Category creation API call
   * Validates: Requirements 3.2
   * 
   * For any valid category data (name with 1-100 characters), submitting the form
   * should call the endpoint POST /api/store/categories with correct data
   */
  it('Property 2: Category creation API call - for any valid category data, API is called with correct data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
        }),
        async (categoryData) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.createCategory.mockResolvedValue({ id: 1, ...categoryData, created_at: new Date().toISOString() })
          
          // Mount component
          const wrapper = mount(AdminCategories)
          await wrapper.vm.$nextTick()
          
          // Call the create handler directly with the data
          await wrapper.vm.handleCreateCategory(categoryData)
          
          // Verify API was called with correct data
          expect(api.createCategory).toHaveBeenCalledWith(categoryData)
          expect(api.createCategory).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 3: Category list update after creation
   * Validates: Requirements 3.3
   * 
   * For any successfully created category, the category list should update
   * and include the new category
   */
  it('Property 3: Category list update after creation - for any created category, list updates and includes new category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            created_at: validDateArbitrary()
          }),
          { minLength: 0, maxLength: 10 }
        ),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
        }),
        async (initialCategories, newCategoryData) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          const newCategory = {
            id: initialCategories.length + 1,
            name: newCategoryData.name,
            description: newCategoryData.description || null,
            created_at: new Date().toISOString()
          }
          
          // Mock API responses
          api.getCategories
            .mockResolvedValueOnce(initialCategories) // Initial load
            .mockResolvedValueOnce([...initialCategories, newCategory]) // After creation
          api.createCategory.mockResolvedValue(newCategory)
          
          // Mount component
          const wrapper = mount(AdminCategories)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify initial state
          const initialCount = wrapper.vm.categories.length
          expect(initialCount).toBe(initialCategories.length)
          
          // Create new category
          await wrapper.vm.handleCreateCategory(newCategoryData)
          await wrapper.vm.$nextTick()
          
          // Verify list was updated (loadCategories was called again)
          expect(api.getCategories).toHaveBeenCalledTimes(2)
          
          // Verify the new category is in the list
          expect(wrapper.vm.categories.length).toBe(initialCount + 1)
          const foundCategory = wrapper.vm.categories.find(c => c.name === newCategory.name)
          expect(foundCategory).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 5: Category deletion API call
   * Validates: Requirements 4.2
   * 
   * For any category with a valid ID, confirming deletion should call
   * the endpoint DELETE /api/store/categories with the correct identifier
   */
  it('Property 5: Category deletion API call - for any category with valid ID, API is called with correct identifier', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          created_at: validDateArbitrary()
        }),
        async (category) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([category])
          api.deleteCategory.mockResolvedValue(true)
          
          // Mount component
          const wrapper = mount(AdminCategories)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Set the category to delete
          wrapper.vm.categoryToDelete = category
          
          // Call delete handler
          await wrapper.vm.handleDeleteCategory()
          
          // Verify API was called with correct ID
          expect(api.deleteCategory).toHaveBeenCalledWith(category.id)
          expect(api.deleteCategory).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 6: Category list update after deletion
   * Validates: Requirements 4.3
   * 
   * For any successfully deleted category, it should disappear from
   * the displayed category list
   */
  it('Property 6: Category list update after deletion - for any deleted category, it disappears from the list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
            created_at: validDateArbitrary()
          }),
          { minLength: 1, maxLength: 20 }
        ).chain(categories => {
          // Ensure unique IDs
          const uniqueCategories = categories.map((cat, idx) => ({ ...cat, id: idx + 1 }))
          return fc.constant(uniqueCategories)
        }),
        fc.integer({ min: 0, max: 19 }), // Index of category to delete
        async (categories, deleteIndex) => {
          // Ensure deleteIndex is valid
          if (deleteIndex >= categories.length) return
          
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          const categoryToDelete = categories[deleteIndex]
          const remainingCategories = categories.filter(c => c.id !== categoryToDelete.id)
          
          // Mock API responses
          api.getCategories
            .mockResolvedValueOnce(categories) // Initial load
            .mockResolvedValueOnce(remainingCategories) // After deletion
          api.deleteCategory.mockResolvedValue(true)
          
          // Mount component
          const wrapper = mount(AdminCategories)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify initial state
          const initialCount = wrapper.vm.categories.length
          expect(initialCount).toBe(categories.length)
          expect(wrapper.vm.categories.find(c => c.id === categoryToDelete.id)).toBeDefined()
          
          // Set category to delete and delete it
          wrapper.vm.categoryToDelete = categoryToDelete
          await wrapper.vm.handleDeleteCategory()
          await wrapper.vm.$nextTick()
          
          // Verify list was updated (loadCategories was called again)
          expect(api.getCategories).toHaveBeenCalledTimes(2)
          
          // Verify the category is no longer in the list
          expect(wrapper.vm.categories.length).toBe(initialCount - 1)
          expect(wrapper.vm.categories.find(c => c.id === categoryToDelete.id)).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})
