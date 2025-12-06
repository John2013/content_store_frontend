/**
 * Property-based tests for AdminProducts component
 * Feature: admin-panel
 * Validates: Requirements 5.2, 5.3, 5.4, 6.2, 6.3, 7.2, 7.3, 8.2, 8.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminProducts from './AdminProducts.vue'
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

// Helper to generate valid product data
const productArbitrary = () => 
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => p.toFixed(2)),
    category_id: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
    is_active: fc.boolean(),
    created_at: validDateArbitrary(),
    updated_at: validDateArbitrary(),
    category: fc.option(
      fc.record({
        id: fc.integer({ min: 1, max: 100 }),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
        created_at: validDateArbitrary()
      }),
      { nil: null }
    )
  })

// Helper to generate valid category data
const categoryArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 100 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    created_at: validDateArbitrary()
  })

describe('AdminProducts - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Unit test: Loading products with inactive filter
   * Validates: Requirements 5.1, 6.3
   * 
   * Test that products are loaded from API when component mounts with include_inactive parameter
   */
  it('should load products from API on mount with include_inactive parameter', async () => {
    const mockProducts = [
      {
        id: 1,
        title: 'Test Product 1',
        description: 'Description 1',
        price: '99.99',
        category_id: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        category: { id: 1, name: 'Category 1', description: null, created_at: '2024-01-01T00:00:00Z' }
      },
      {
        id: 2,
        title: 'Test Product 2',
        description: null,
        price: '49.99',
        category_id: null,
        is_active: false,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        category: null
      }
    ]

    // Mock API responses
    api.getCategories.mockResolvedValue([])
    api.getProducts.mockResolvedValue(mockProducts)

    // Mount component
    const wrapper = mount(AdminProducts)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify API was called with default showInactive=false
    expect(api.getProducts).toHaveBeenCalledWith(null, 0, 20, false)
    
    // Verify products are loaded
    expect(wrapper.vm.products).toEqual(mockProducts)
    expect(wrapper.vm.loading).toBe(false)
    
    // Verify products are displayed
    expect(wrapper.text()).toContain('Test Product 1')
    expect(wrapper.text()).toContain('Test Product 2')
  })

  /**
   * Unit test: Product edit functionality
   * Validates: Requirements 3.1, 3.2
   * 
   * Test that product can be edited using PATCH
   */
  it('should update product using PATCH API', async () => {
    const mockProduct = {
      id: 1,
      title: 'Original Title',
      description: 'Original Description',
      price: '99.99',
      content_text: 'Original Content',
      category_id: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: null
    }

    const updatedData = {
      title: 'Updated Title',
      price: 149.99
    }

    api.getCategories.mockResolvedValue([])
    api.getProducts.mockResolvedValue([mockProduct])
    api.patchProduct.mockResolvedValue({ ...mockProduct, ...updatedData })

    const wrapper = mount(AdminProducts)
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Set product to edit
    wrapper.vm.productToEdit = mockProduct

    // Call update handler
    await wrapper.vm.handleUpdateProduct(updatedData)

    // Verify API was called with correct data
    expect(api.patchProduct).toHaveBeenCalledWith(mockProduct.id, updatedData)
    expect(api.patchProduct).toHaveBeenCalledTimes(1)
    
    // Verify success notification
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Товар успешно обновлен',
      type: 'success'
    })
  })

  /**
   * Unit test: Product status toggle
   * Validates: Requirements 6.1
   * 
   * Test that product status can be toggled using PATCH
   */
  it('should toggle product status using PATCH API', async () => {
    const mockProduct = {
      id: 1,
      title: 'Test Product',
      description: 'Test Description',
      price: '99.99',
      content_text: 'Test Content',
      category_id: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: null
    }

    api.getCategories.mockResolvedValue([])
    api.getProducts.mockResolvedValue([mockProduct])
    api.patchProduct.mockResolvedValue({ ...mockProduct, is_active: false })

    const wrapper = mount(AdminProducts)
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Call toggle handler
    await wrapper.vm.toggleProductStatus(mockProduct)

    // Verify API was called with correct data
    expect(api.patchProduct).toHaveBeenCalledWith(mockProduct.id, {
      is_active: false
    })
    expect(api.patchProduct).toHaveBeenCalledTimes(1)
    
    // Verify success notification
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Товар деактивирован',
      type: 'success'
    })
  })

  /**
   * Unit test: Inactive products filter
   * Validates: Requirements 6.3
   * 
   * Test that inactive filter passes correct parameter to API
   */
  it('should pass include_inactive parameter when filter is enabled', async () => {
    api.getCategories.mockResolvedValue([])
    api.getProducts.mockResolvedValue([])

    const wrapper = mount(AdminProducts)
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Clear previous calls
    vi.clearAllMocks()

    // Enable inactive filter
    wrapper.vm.showInactive = true
    await wrapper.vm.handleInactiveFilter()

    // Verify API was called with include_inactive=true
    expect(api.getProducts).toHaveBeenCalledWith(null, 0, 20, true)
  })

  /**
   * Unit test: Empty state display
   * Validates: Requirements 5.1
   * 
   * Test that empty state is displayed when no products exist
   */
  it('should display empty state when no products exist', async () => {
    // Mock API to return empty array
    api.getCategories.mockResolvedValue([])
    api.getProducts.mockResolvedValue([])

    // Mount component
    const wrapper = mount(AdminProducts)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify empty state is displayed
    expect(wrapper.vm.products).toEqual([])
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Товары отсутствуют')
    expect(wrapper.text()).toContain('Создайте первый товар для продажи')
  })

  /**
   * Unit test: Error handling on load
   * Validates: Requirements 5.5
   * 
   * Test that error notification is displayed when loading products fails
   */
  it('should display error notification when loading products fails', async () => {
    const errorMessage = 'Network error'
    
    // Mock API to throw error
    api.getCategories.mockResolvedValue([])
    api.getProducts.mockRejectedValue(new Error(errorMessage))

    // Mount component
    const wrapper = mount(AdminProducts)

    // Wait for async operations
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Verify error notification was called
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Ошибка при загрузке товаров: ' + errorMessage,
      type: 'error'
    })
    
    // Verify loading state is cleared
    expect(wrapper.vm.loading).toBe(false)
  })
})

describe('AdminProducts - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Feature: admin-panel, Property 7: Product display completeness
   * Validates: Requirements 5.2
   * 
   * For any set of products returned by the API, the system should display
   * all mandatory fields for each product: title, price, category, status, and creation date
   */
  it('Property 7: Product display completeness - for any set of products, all mandatory fields are displayed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(productArbitrary(), { minLength: 1, maxLength: 20 }),
        async (products) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API to return the generated products
          api.getProducts.mockResolvedValue(products)
          api.getCategories.mockResolvedValue([])
          
          // Mount component
          const wrapper = mount(AdminProducts)
          
          // Wait for component to load data
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify all products are displayed
          expect(wrapper.vm.products).toEqual(products)
          
          // Verify each product displays all mandatory fields
          products.forEach(product => {
            // Check that product title is displayed
            expect(wrapper.text()).toContain(product.title)
            
            // Check that price is displayed
            expect(wrapper.text()).toContain(product.price)
            
            // Check that category is displayed (or placeholder for null)
            if (product.category) {
              expect(wrapper.text()).toContain(product.category.name)
            } else {
              expect(wrapper.text()).toContain('Без категории')
            }
            
            // Check that status is displayed
            expect(wrapper.text()).toContain(product.is_active ? 'Активен' : 'Неактивен')
            
            // Check that created_at is formatted and displayed
            expect(wrapper.text()).toContain('Создано:')
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 8: Product category filtering
   * Validates: Requirements 5.3
   * 
   * For any selected category, the displayed product list should contain only
   * products with the corresponding category_id
   */
  it('Property 8: Product category filtering - for any selected category, API is called with correct category_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.array(productArbitrary(), { minLength: 0, maxLength: 20 }),
        async (categoryId, products) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts.mockResolvedValue(products)
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Clear previous calls
          vi.clearAllMocks()
          
          // Set selected category
          wrapper.vm.selectedCategory = categoryId
          
          // Trigger filter
          await wrapper.vm.handleCategoryFilter()
          await wrapper.vm.$nextTick()
          
          // Verify API was called with the correct category_id
          expect(api.getProducts).toHaveBeenCalledWith(
            categoryId,
            0, // skip should be reset to 0
            wrapper.vm.pagination.limit,
            wrapper.vm.showInactive
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 9: Product pagination parameters
   * Validates: Requirements 5.4
   * 
   * For any values of skip and limit, the API call should pass these parameters
   * correctly in the query string
   */
  it('Property 9: Product pagination parameters - for any skip/limit values, API is called with correct parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        async (skip, limit) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts.mockResolvedValue([])
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          
          // Clear previous calls
          vi.clearAllMocks()
          
          // Set pagination values
          wrapper.vm.pagination.skip = skip
          wrapper.vm.pagination.limit = limit
          
          // Load products
          await wrapper.vm.loadProducts()
          await wrapper.vm.$nextTick()
          
          // Verify API was called with correct pagination parameters
          expect(api.getProducts).toHaveBeenCalledWith(
            wrapper.vm.selectedCategory,
            skip,
            limit,
            wrapper.vm.showInactive
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 10: Product creation API call
   * Validates: Requirements 6.2
   * 
   * For any valid product data (title, price > 0, content), submitting the form
   * should call the endpoint POST /api/store/products with correct data
   */
  it('Property 10: Product creation API call - for any valid product data, API is called with correct data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          content_text: fc.string({ minLength: 1, maxLength: 5000 }).filter(s => s.trim().length > 0),
          category_id: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          is_active: fc.boolean()
        }),
        async (productData) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts.mockResolvedValue([])
          api.createProduct.mockResolvedValue({ 
            id: 1, 
            ...productData, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          
          // Call the create handler directly with the data
          await wrapper.vm.handleCreateProduct(productData)
          
          // Verify API was called with correct data
          expect(api.createProduct).toHaveBeenCalledWith(productData)
          expect(api.createProduct).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 11: Product list update after creation
   * Validates: Requirements 6.3
   * 
   * For any successfully created product, the product list should update
   * and include the new product
   */
  it('Property 11: Product list update after creation - for any created product, list updates and includes new product', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(productArbitrary(), { minLength: 0, maxLength: 10 }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          content_text: fc.string({ minLength: 1, maxLength: 5000 }).filter(s => s.trim().length > 0),
          category_id: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          is_active: fc.boolean()
        }),
        async (initialProducts, newProductData) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          const newProduct = {
            id: initialProducts.length + 1,
            title: newProductData.title,
            description: newProductData.description || null,
            price: newProductData.price.toFixed(2),
            category_id: newProductData.category_id || null,
            is_active: newProductData.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: null
          }
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts
            .mockResolvedValueOnce(initialProducts) // Initial load
            .mockResolvedValueOnce([...initialProducts, newProduct]) // After creation
          api.createProduct.mockResolvedValue(newProduct)
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify initial state
          const initialCount = wrapper.vm.products.length
          expect(initialCount).toBe(initialProducts.length)
          
          // Create new product
          await wrapper.vm.handleCreateProduct(newProductData)
          await wrapper.vm.$nextTick()
          
          // Verify list was updated (loadProducts was called again)
          expect(api.getProducts).toHaveBeenCalledTimes(2)
          
          // Verify the new product is in the list
          expect(wrapper.vm.products.length).toBe(initialCount + 1)
          const foundProduct = wrapper.vm.products.find(p => p.title === newProduct.title)
          expect(foundProduct).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 13: Bulk product creation API call
   * Validates: Requirements 7.2
   * 
   * For any array of valid product data, submitting the bulk form should call
   * the endpoint POST /api/store/products/create-many with the array of products
   */
  it('Property 13: Bulk product creation API call - for any array of valid products, API is called with correct data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            content_text: fc.string({ minLength: 1, maxLength: 5000 }).filter(s => s.trim().length > 0),
            category_id: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            is_active: fc.boolean()
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (productsData) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts.mockResolvedValue([])
          api.createProductsBulk.mockResolvedValue(
            productsData.map((p, idx) => ({
              id: idx + 1,
              ...p,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          )
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          
          // Call the bulk create handler directly with the data
          await wrapper.vm.handleBulkCreateProducts(productsData)
          
          // Verify API was called with correct data
          expect(api.createProductsBulk).toHaveBeenCalledWith(productsData)
          expect(api.createProductsBulk).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 14: Bulk product creation count
   * Validates: Requirements 7.3
   * 
   * For any successfully created products through bulk creation, the number of
   * new products in the list should match the number of submitted products
   */
  it('Property 14: Bulk product creation count - for any bulk created products, count matches submitted count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(productArbitrary(), { minLength: 0, maxLength: 5 }),
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            content_text: fc.string({ minLength: 1, maxLength: 5000 }).filter(s => s.trim().length > 0),
            category_id: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            is_active: fc.boolean()
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (initialProducts, newProductsData) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          const createdProducts = newProductsData.map((p, idx) => ({
            id: initialProducts.length + idx + 1,
            title: p.title,
            description: p.description || null,
            price: p.price.toFixed(2),
            category_id: p.category_id || null,
            is_active: p.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: null
          }))
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts
            .mockResolvedValueOnce(initialProducts) // Initial load
            .mockResolvedValueOnce([...initialProducts, ...createdProducts]) // After bulk creation
          api.createProductsBulk.mockResolvedValue(createdProducts)
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify initial state
          const initialCount = wrapper.vm.products.length
          expect(initialCount).toBe(initialProducts.length)
          
          // Create products in bulk
          await wrapper.vm.handleBulkCreateProducts(newProductsData)
          await wrapper.vm.$nextTick()
          
          // Verify list was updated (loadProducts was called again)
          expect(api.getProducts).toHaveBeenCalledTimes(2)
          
          // Verify the count of new products matches
          expect(wrapper.vm.products.length).toBe(initialCount + newProductsData.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 15: Product deletion API call
   * Validates: Requirements 8.2
   * 
   * For any product with a valid ID, confirming deletion should call
   * the endpoint DELETE /api/store/products/{product_id} with the correct identifier
   */
  it('Property 15: Product deletion API call - for any product with valid ID, API is called with correct identifier', async () => {
    await fc.assert(
      fc.asyncProperty(
        productArbitrary(),
        async (product) => {
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts.mockResolvedValue([product])
          api.deleteProduct.mockResolvedValue(true)
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Set the product to delete
          wrapper.vm.productToDelete = product
          
          // Call delete handler
          await wrapper.vm.handleDeleteProduct()
          
          // Verify API was called with correct ID
          expect(api.deleteProduct).toHaveBeenCalledWith(product.id)
          expect(api.deleteProduct).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 16: Product list update after deletion
   * Validates: Requirements 8.3
   * 
   * For any successfully deleted product, it should disappear from
   * the displayed product list
   */
  it('Property 16: Product list update after deletion - for any deleted product, it disappears from the list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(productArbitrary(), { minLength: 1, maxLength: 20 })
          .chain(products => {
            // Ensure unique IDs
            const uniqueProducts = products.map((prod, idx) => ({ ...prod, id: idx + 1 }))
            return fc.constant(uniqueProducts)
          }),
        fc.integer({ min: 0, max: 19 }), // Index of product to delete
        async (products, deleteIndex) => {
          // Ensure deleteIndex is valid
          if (deleteIndex >= products.length) return
          
          // Clear mocks for this iteration
          vi.clearAllMocks()
          
          const productToDelete = products[deleteIndex]
          const remainingProducts = products.filter(p => p.id !== productToDelete.id)
          
          // Mock API responses
          api.getCategories.mockResolvedValue([])
          api.getProducts
            .mockResolvedValueOnce(products) // Initial load
            .mockResolvedValueOnce(remainingProducts) // After deletion
          api.deleteProduct.mockResolvedValue(true)
          
          // Mount component
          const wrapper = mount(AdminProducts)
          await wrapper.vm.$nextTick()
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Verify initial state
          const initialCount = wrapper.vm.products.length
          expect(initialCount).toBe(products.length)
          expect(wrapper.vm.products.find(p => p.id === productToDelete.id)).toBeDefined()
          
          // Set product to delete and delete it
          wrapper.vm.productToDelete = productToDelete
          await wrapper.vm.handleDeleteProduct()
          await wrapper.vm.$nextTick()
          
          // Verify list was updated (loadProducts was called again)
          expect(api.getProducts).toHaveBeenCalledTimes(2)
          
          // Verify the product is no longer in the list
          expect(wrapper.vm.products.length).toBe(initialCount - 1)
          expect(wrapper.vm.products.find(p => p.id === productToDelete.id)).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })
})

