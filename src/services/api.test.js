/**
 * Unit tests for API client methods
 * Feature: api-fixes
 * Tests new category and product endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import api from './api.js'

describe('API Client - Category Methods', () => {
  let fetchMock

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = vi.fn()
    global.fetch = fetchMock
    
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getCategory should fetch category by ID', async () => {
    const mockCategory = { id: 1, name: 'Test', description: 'Desc', created_at: '2024-01-01' }
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategory
    })

    const result = await api.getCategory(1)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/store/categories/1')
    expect(result).toEqual(mockCategory)
  })

  it('getCategoriesWithCounts should include include_counts parameter', async () => {
    const mockCategories = [
      { id: 1, name: 'Test', product_count: 5 }
    ]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories
    })

    const result = await api.getCategoriesWithCounts()

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/store/categories?include_counts=true')
    expect(result).toEqual(mockCategories)
  })

  it('updateCategory should send PUT request with data', async () => {
    const mockCategory = { id: 1, name: 'Updated', description: 'New desc' }
    const updateData = { name: 'Updated', description: 'New desc' }
    
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategory
    })

    const result = await api.updateCategory(1, updateData)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify(updateData)
      })
    )
    expect(result).toEqual(mockCategory)
  })

  it('patchCategory should send PATCH request with partial data', async () => {
    const mockCategory = { id: 1, name: 'Patched', description: 'Old desc' }
    const patchData = { name: 'Patched' }
    
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategory
    })

    const result = await api.patchCategory(1, patchData)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify(patchData)
      })
    )
    expect(result).toEqual(mockCategory)
  })

  it('deleteCategory should use path parameter', async () => {
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: true
    })

    const result = await api.deleteCategory(1)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/categories/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    )
    expect(result).toBe(true)
  })
})

describe('API Client - Product Methods', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getProducts should include include_inactive parameter when true', async () => {
    const mockProducts = [{ id: 1, title: 'Test', is_active: false }]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })

    const result = await api.getProducts(null, 0, 100, true)

    const callUrl = fetchMock.mock.calls[0][0]
    expect(callUrl).toContain('include_inactive=true')
    expect(result).toEqual(mockProducts)
  })

  it('getProducts should not include include_inactive parameter when false', async () => {
    const mockProducts = [{ id: 1, title: 'Test', is_active: true }]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })

    const result = await api.getProducts(null, 0, 100, false)

    const callUrl = fetchMock.mock.calls[0][0]
    expect(callUrl).not.toContain('include_inactive')
    expect(result).toEqual(mockProducts)
  })

  it('updateProduct should send PUT request with data', async () => {
    const mockProduct = { 
      id: 1, 
      title: 'Updated', 
      price: 29.99, 
      content_text: 'Content',
      is_active: true 
    }
    const updateData = { 
      title: 'Updated', 
      price: 29.99, 
      content_text: 'Content',
      is_active: true 
    }
    
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProduct
    })

    const result = await api.updateProduct(1, updateData)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products/1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify(updateData)
      })
    )
    expect(result).toEqual(mockProduct)
  })

  it('patchProduct should send PATCH request with partial data', async () => {
    const mockProduct = { 
      id: 1, 
      title: 'Original', 
      price: 19.99, 
      is_active: false 
    }
    const patchData = { is_active: false }
    
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProduct
    })

    const result = await api.patchProduct(1, patchData)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/store/products/1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify(patchData)
      })
    )
    expect(result).toEqual(mockProduct)
  })
})

describe('API Client - Error Handling', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
    
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getCategory should throw error when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    await expect(api.getCategory(999)).rejects.toThrow('Failed to fetch category')
  })

  it('updateCategory should throw error when response is not ok', async () => {
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422
    })

    await expect(api.updateCategory(1, { name: '' })).rejects.toThrow('Failed to update category')
  })

  it('patchCategory should throw error when response is not ok', async () => {
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    await expect(api.patchCategory(999, { name: 'Test' })).rejects.toThrow('Failed to patch category')
  })

  it('updateProduct should throw error when response is not ok', async () => {
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422
    })

    await expect(api.updateProduct(1, { price: -1 })).rejects.toThrow('Failed to update product')
  })

  it('patchProduct should throw error when response is not ok', async () => {
    localStorage.getItem.mockReturnValue('test-token')
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    await expect(api.patchProduct(999, { title: 'Test' })).rejects.toThrow('Failed to patch product')
  })
})
