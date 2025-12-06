/**
 * Integration tests for API Fixes
 * Feature: api-fixes
 * 
 * These tests verify the complete lifecycle of API operations including
 * category and product CRUD operations, authentication flows, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import api from './services/api.js'

// Mock fetch globally
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

global.localStorage = localStorageMock

describe('Integration Tests - API Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Set a default token for authenticated requests
    localStorage.setItem('token', 'test-token-123')
  })

  /**
   * Integration Test: Category lifecycle
   * Validates: Requirements 1.2, 2.1, 2.2, 5.1
   * 
   * This test verifies the complete category lifecycle:
   * 1. Create a new category
   * 2. Get the category by ID
   * 3. Update the category with PUT (full update)
   * 4. Update the category with PATCH (partial update)
   * 5. Delete the category
   * 6. Verify the category no longer exists
   */
  it('should complete full category lifecycle: Create → Get → Update (PUT) → Update (PATCH) → Delete', async () => {
    // Step 1: Create category
    const createData = {
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    }
    
    const createdCategory = {
      id: 1,
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      created_at: '2024-01-01T00:00:00Z',
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdCategory
    })
    
    const createResult = await api.createCategory(createData)
    
    // Verify create request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        }),
        body: JSON.stringify(createData)
      })
    )
    
    // Verify created category
    expect(createResult).toEqual(createdCategory)
    expect(createResult.id).toBe(1)
    expect(createResult.name).toBe('Electronics')
    
    // Step 2: Get category by ID
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdCategory
    })
    
    const getResult = await api.getCategory(1)
    
    // Verify get request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1'
    )
    
    // Verify retrieved category matches created category
    expect(getResult).toEqual(createdCategory)
    expect(getResult.id).toBe(1)
    expect(getResult.name).toBe('Electronics')
    expect(getResult.description).toBe('Electronic devices and accessories')
    
    // Step 3: Update category with PUT (full update)
    const putData = {
      name: 'Consumer Electronics',
      description: 'Consumer electronic devices and gadgets'
    }
    
    const updatedCategoryPut = {
      id: 1,
      name: 'Consumer Electronics',
      description: 'Consumer electronic devices and gadgets',
      created_at: '2024-01-01T00:00:00Z',
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedCategoryPut
    })
    
    const putResult = await api.updateCategory(1, putData)
    
    // Verify PUT request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        }),
        body: JSON.stringify(putData)
      })
    )
    
    // Verify all fields were updated
    expect(putResult).toEqual(updatedCategoryPut)
    expect(putResult.name).toBe('Consumer Electronics')
    expect(putResult.description).toBe('Consumer electronic devices and gadgets')
    
    // Step 4: Update category with PATCH (partial update)
    const patchData = {
      description: 'Updated description only'
    }
    
    const updatedCategoryPatch = {
      id: 1,
      name: 'Consumer Electronics', // Name unchanged
      description: 'Updated description only',
      created_at: '2024-01-01T00:00:00Z',
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedCategoryPatch
    })
    
    const patchResult = await api.patchCategory(1, patchData)
    
    // Verify PATCH request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        }),
        body: JSON.stringify(patchData)
      })
    )
    
    // Verify only specified field was updated, name remained unchanged
    expect(patchResult).toEqual(updatedCategoryPatch)
    expect(patchResult.name).toBe('Consumer Electronics') // Unchanged
    expect(patchResult.description).toBe('Updated description only') // Changed
    
    // Step 5: Delete category
    fetch.mockResolvedValueOnce({
      ok: true
    })
    
    const deleteResult = await api.deleteCategory(1)
    
    // Verify DELETE request uses path parameter (not query parameter)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123'
        })
      })
    )
    
    // Verify deletion succeeded
    expect(deleteResult).toBe(true)
    
    // Step 6: Verify category no longer exists (404)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })
    
    await expect(api.getCategory(1)).rejects.toThrow('Failed to fetch category')
    
    // Verify final state is correct
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1'
    )
  })

  /**
   * Integration Test: Product lifecycle
   * Validates: Requirements 3.1, 3.2, 6.1, 6.2, 6.3, 9.3
   * 
   * This test verifies the complete product lifecycle:
   * 1. Create a product
   * 2. Update the product price
   * 3. Deactivate the product
   * 4. Verify the product is hidden from public lists
   * 5. Verify the product is visible to admin with include_inactive
   */
  it('should complete full product lifecycle: Create → Update price → Deactivate → Verify hidden → Verify visible to admin', async () => {
    // Step 1: Create product
    const createData = {
      title: 'Programming Guide',
      description: 'Complete programming guide',
      price: 29.99,
      content_text: 'This is the content of the programming guide...',
      category_id: 1,
      is_active: true
    }
    
    const createdProduct = {
      id: 1,
      title: 'Programming Guide',
      description: 'Complete programming guide',
      price: '29.99',
      content_text: 'This is the content of the programming guide...',
      category_id: 1,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdProduct
    })
    
    const createResult = await api.createProduct(createData)
    
    // Verify create request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        }),
        body: JSON.stringify(createData)
      })
    )
    
    // Verify created product
    expect(createResult).toEqual(createdProduct)
    expect(createResult.id).toBe(1)
    expect(createResult.price).toBe('29.99')
    expect(createResult.is_active).toBe(true)
    
    // Step 2: Update product price using PATCH
    const patchPriceData = {
      price: 19.99
    }
    
    const updatedProductPrice = {
      ...createdProduct,
      price: '19.99',
      updated_at: '2024-01-02T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedProductPrice
    })
    
    const patchResult = await api.patchProduct(1, patchPriceData)
    
    // Verify PATCH request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        }),
        body: JSON.stringify(patchPriceData)
      })
    )
    
    // Verify only price was updated
    expect(patchResult.price).toBe('19.99')
    expect(patchResult.title).toBe('Programming Guide') // Unchanged
    expect(patchResult.is_active).toBe(true) // Unchanged
    
    // Step 3: Deactivate product using PATCH
    const deactivateData = {
      is_active: false
    }
    
    const deactivatedProduct = {
      ...updatedProductPrice,
      is_active: false,
      updated_at: '2024-01-03T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => deactivatedProduct
    })
    
    const deactivateResult = await api.patchProduct(1, deactivateData)
    
    // Verify PATCH request for deactivation
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(deactivateData)
      })
    )
    
    // Verify product is deactivated but all other data preserved
    expect(deactivateResult.is_active).toBe(false)
    expect(deactivateResult.title).toBe('Programming Guide') // Preserved
    expect(deactivateResult.price).toBe('19.99') // Preserved
    expect(deactivateResult.description).toBe('Complete programming guide') // Preserved
    
    // Step 4: Verify product is hidden from public lists (default behavior)
    const publicProducts = [] // Inactive product not included
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => publicProducts
    })
    
    const publicResult = await api.getProducts(null, 0, 100, false)
    
    // Verify request without include_inactive
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products?skip=0&limit=100'
    )
    
    // Verify inactive product is not in the list
    expect(publicResult).toEqual([])
    expect(publicResult.find(p => p.id === 1)).toBeUndefined()
    
    // Step 5: Verify product is visible to admin with include_inactive=true
    const adminProducts = [deactivatedProduct] // Inactive product included
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => adminProducts
    })
    
    const adminResult = await api.getProducts(null, 0, 100, true)
    
    // Verify request with include_inactive=true
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products?skip=0&limit=100&include_inactive=true'
    )
    
    // Verify inactive product is visible to admin
    expect(adminResult).toHaveLength(1)
    expect(adminResult[0].id).toBe(1)
    expect(adminResult[0].is_active).toBe(false)
  })

  /**
   * Integration Test: Product count in category
   * Validates: Requirements 9.3
   * 
   * This test verifies that:
   * 1. Creating a product in a category increases the product count
   * 2. Only active products are counted
   */
  it('should increase category product count when product is created', async () => {
    // Step 1: Get initial category with count
    const initialCategory = {
      id: 1,
      name: 'Programming',
      description: 'Programming tutorials',
      created_at: '2024-01-01T00:00:00Z',
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => initialCategory
    })
    
    const initialResult = await api.getCategory(1)
    
    // Verify initial count is 0
    expect(initialResult.product_count).toBe(0)
    
    // Step 2: Create a product in the category
    const productData = {
      title: 'JavaScript Guide',
      description: 'Learn JavaScript',
      price: 24.99,
      content_text: 'JavaScript content...',
      category_id: 1,
      is_active: true
    }
    
    const createdProduct = {
      id: 1,
      ...productData,
      price: '24.99',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdProduct
    })
    
    await api.createProduct(productData)
    
    // Step 3: Get category again and verify count increased
    const updatedCategory = {
      ...initialCategory,
      product_count: 1
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedCategory
    })
    
    const updatedResult = await api.getCategory(1)
    
    // Verify count increased to 1
    expect(updatedResult.product_count).toBe(1)
    
    // Step 4: Deactivate the product
    const deactivatedProduct = {
      ...createdProduct,
      is_active: false,
      updated_at: '2024-01-03T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => deactivatedProduct
    })
    
    await api.patchProduct(1, { is_active: false })
    
    // Step 5: Verify count returns to 0 (only active products counted)
    const categoryAfterDeactivation = {
      ...initialCategory,
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => categoryAfterDeactivation
    })
    
    const finalResult = await api.getCategory(1)
    
    // Verify count is back to 0 (inactive products not counted)
    expect(finalResult.product_count).toBe(0)
  })

  /**
   * Integration Test: Authentication flow
   * Validates: Requirements 1.4, 2.5, 3.5, 7.6, 7.7
   * 
   * This test verifies authentication and authorization:
   * 1. Operations without token return 401
   * 2. Operations as non-staff user return 403
   * 3. Operations as staff user succeed
   */
  it('should enforce authentication: no token → 401, non-staff → 403, staff → success', async () => {
    // Step 1: Test operations without token (401)
    localStorage.removeItem('token')
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })
    
    await expect(api.createCategory({ name: 'Test', description: 'Test' }))
      .rejects.toThrow('Failed to create category')
    
    // Verify request was made without Authorization header
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories',
      expect.objectContaining({
        method: 'POST',
        headers: expect.not.objectContaining({
          'Authorization': expect.anything()
        })
      })
    )
    
    // Step 2: Test operations as non-staff user (403)
    localStorage.setItem('token', 'non-staff-token')
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403
    })
    
    await expect(api.updateCategory(1, { name: 'Updated', description: 'Updated' }))
      .rejects.toThrow('Failed to update category')
    
    // Verify request was made with token but rejected due to insufficient permissions
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Authorization': 'Bearer non-staff-token'
        })
      })
    )
    
    // Step 3: Test operations as staff user (success)
    localStorage.setItem('token', 'staff-token')
    
    const categoryData = {
      name: 'Electronics',
      description: 'Electronic devices'
    }
    
    const createdCategory = {
      id: 1,
      name: 'Electronics',
      description: 'Electronic devices',
      created_at: '2024-01-01T00:00:00Z',
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdCategory
    })
    
    const result = await api.createCategory(categoryData)
    
    // Verify request succeeded with staff token
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer staff-token'
        })
      })
    )
    
    expect(result).toEqual(createdCategory)
  })

  /**
   * Integration Test: Product operations authentication
   * Validates: Requirements 3.5, 7.6, 7.7
   * 
   * This test verifies product operations require proper authentication
   */
  it('should enforce authentication for product operations', async () => {
    // Step 1: Test product update without token (401)
    localStorage.removeItem('token')
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })
    
    await expect(api.updateProduct(1, {
      title: 'Updated',
      description: 'Updated',
      price: 29.99,
      content_text: 'Content',
      is_active: true
    })).rejects.toThrow('Failed to update product')
    
    // Step 2: Test product patch as non-staff (403)
    localStorage.setItem('token', 'non-staff-token')
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403
    })
    
    await expect(api.patchProduct(1, { price: 19.99 }))
      .rejects.toThrow('Failed to patch product')
    
    // Step 3: Test product delete as staff (success)
    localStorage.setItem('token', 'staff-token')
    
    fetch.mockResolvedValueOnce({
      ok: true
    })
    
    const result = await api.deleteProduct(1)
    
    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer staff-token'
        })
      })
    )
  })

  /**
   * Integration Test: include_inactive parameter authorization
   * Validates: Requirements 6.3
   * 
   * This test verifies that include_inactive parameter is only effective for staff users
   */
  it('should only allow staff users to use include_inactive parameter', async () => {
    // Step 1: Non-staff user requests with include_inactive (parameter ignored)
    localStorage.setItem('token', 'non-staff-token')
    
    const activeProductsOnly = [
      {
        id: 1,
        title: 'Active Product',
        price: '29.99',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => activeProductsOnly
    })
    
    const nonStaffResult = await api.getProducts(null, 0, 100, true)
    
    // Verify request includes the parameter
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products?skip=0&limit=100&include_inactive=true'
    )
    
    // Backend should ignore parameter for non-staff, returning only active products
    expect(nonStaffResult).toHaveLength(1)
    expect(nonStaffResult.every(p => p.is_active)).toBe(true)
    
    // Step 2: Staff user requests with include_inactive (parameter works)
    localStorage.setItem('token', 'staff-token')
    
    const allProducts = [
      {
        id: 1,
        title: 'Active Product',
        price: '29.99',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        title: 'Inactive Product',
        price: '19.99',
        is_active: false,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => allProducts
    })
    
    const staffResult = await api.getProducts(null, 0, 100, true)
    
    // Verify staff user gets both active and inactive products
    expect(staffResult).toHaveLength(2)
    expect(staffResult.some(p => p.is_active === false)).toBe(true)
  })

  /**
   * Integration Test: Error scenarios
   * Validates: Requirements 2.4, 3.4, 7.4, 7.5
   * 
   * This test verifies proper error handling:
   * 1. Updating non-existent resource returns 404
   * 2. Invalid data returns 422
   * 3. System state remains unchanged after errors
   */
  it('should handle error scenarios: non-existent resource → 404, invalid data → 422', async () => {
    localStorage.setItem('token', 'staff-token')
    
    // Step 1: Test updating non-existent category (404)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })
    
    await expect(api.updateCategory(999, {
      name: 'Non-existent',
      description: 'Does not exist'
    })).rejects.toThrow('Failed to update category')
    
    // Verify 404 request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/999',
      expect.objectContaining({
        method: 'PUT'
      })
    )
    
    // Step 2: Test updating non-existent product (404)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })
    
    await expect(api.patchProduct(999, { price: 29.99 }))
      .rejects.toThrow('Failed to patch product')
    
    // Verify 404 request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products/999',
      expect.objectContaining({
        method: 'PATCH'
      })
    )
    
    // Step 3: Test deleting non-existent category (404)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })
    
    await expect(api.deleteCategory(999))
      .rejects.toThrow('Failed to delete category')
    
    // Step 4: Test invalid data - empty category name (422)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            loc: ['body', 'name'],
            msg: 'field required',
            type: 'value_error.missing'
          }
        ]
      })
    })
    
    await expect(api.createCategory({
      name: '',
      description: 'Invalid'
    })).rejects.toThrow('Failed to create category')
    
    // Step 5: Test invalid data - negative price (422)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            loc: ['body', 'price'],
            msg: 'ensure this value is greater than 0',
            type: 'value_error.number.not_gt'
          }
        ]
      })
    })
    
    await expect(api.createProduct({
      title: 'Test Product',
      description: 'Test',
      price: -10,
      content_text: 'Content',
      is_active: true
    })).rejects.toThrow('Failed to create product')
    
    // Step 6: Test invalid data - price of zero (422)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            loc: ['body', 'price'],
            msg: 'ensure this value is greater than 0',
            type: 'value_error.number.not_gt'
          }
        ]
      })
    })
    
    await expect(api.updateProduct(1, {
      title: 'Test Product',
      description: 'Test',
      price: 0,
      content_text: 'Content',
      is_active: true
    })).rejects.toThrow('Failed to update product')
    
    // Step 7: Test invalid data - name too long (422)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          {
            loc: ['body', 'name'],
            msg: 'ensure this value has at most 100 characters',
            type: 'value_error.any_str.max_length'
          }
        ]
      })
    })
    
    const longName = 'a'.repeat(101)
    await expect(api.createCategory({
      name: longName,
      description: 'Too long'
    })).rejects.toThrow('Failed to create category')
  })

  /**
   * Integration Test: System state unchanged after errors
   * Validates: Requirements 2.4, 3.4
   * 
   * This test verifies that failed operations don't corrupt system state
   */
  it('should maintain system state unchanged after errors', async () => {
    localStorage.setItem('token', 'staff-token')
    
    // Step 1: Create a category successfully
    const originalCategory = {
      id: 1,
      name: 'Original Name',
      description: 'Original description',
      created_at: '2024-01-01T00:00:00Z',
      product_count: 0
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => originalCategory
    })
    
    const created = await api.createCategory({
      name: 'Original Name',
      description: 'Original description'
    })
    
    expect(created).toEqual(originalCategory)
    
    // Step 2: Attempt to update with invalid data (422)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422
    })
    
    await expect(api.updateCategory(1, {
      name: '', // Invalid: empty name
      description: 'Updated'
    })).rejects.toThrow('Failed to update category')
    
    // Step 3: Verify category state unchanged by fetching it again
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => originalCategory
    })
    
    const afterError = await api.getCategory(1)
    
    // Verify state is unchanged
    expect(afterError).toEqual(originalCategory)
    expect(afterError.name).toBe('Original Name')
    expect(afterError.description).toBe('Original description')
    
    // Step 4: Create a product successfully
    const originalProduct = {
      id: 1,
      title: 'Original Product',
      description: 'Original description',
      price: '29.99',
      content_text: 'Original content',
      category_id: 1,
      is_active: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => originalProduct
    })
    
    const createdProduct = await api.createProduct({
      title: 'Original Product',
      description: 'Original description',
      price: 29.99,
      content_text: 'Original content',
      category_id: 1,
      is_active: true
    })
    
    expect(createdProduct).toEqual(originalProduct)
    
    // Step 5: Attempt to update with invalid price (422)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422
    })
    
    await expect(api.patchProduct(1, {
      price: -5 // Invalid: negative price
    })).rejects.toThrow('Failed to patch product')
    
    // Step 6: Verify product state unchanged
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => originalProduct
    })
    
    const productAfterError = await api.getProduct(1)
    
    // Verify state is unchanged
    expect(productAfterError).toEqual(originalProduct)
    expect(productAfterError.price).toBe('29.99')
    expect(productAfterError.title).toBe('Original Product')
    
    // Step 7: Attempt to delete non-existent resource (404)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })
    
    await expect(api.deleteCategory(999))
      .rejects.toThrow('Failed to delete category')
    
    // Step 8: Verify original category still exists
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => originalCategory
    })
    
    const stillExists = await api.getCategory(1)
    
    expect(stillExists).toEqual(originalCategory)
  })
})
