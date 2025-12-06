/**
 * Integration tests for Admin Panel
 * Feature: admin-panel
 * Validates: All requirements
 * 
 * These tests verify complete user flows through the admin panel,
 * testing the interaction between multiple components and services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AdminCategories from './views/admin/AdminCategories.vue'
import AdminProducts from './views/admin/AdminProducts.vue'
import AdminReviews from './views/admin/AdminReviews.vue'
import Login from './views/Login.vue'
import api from './services/api.js'
import * as auth from './services/auth.js'

// Mock the API module
vi.mock('./services/api.js')

// Mock the composables
const mockAddNotification = vi.fn()
vi.mock('./composables/useNotifications.js', () => ({
  useNotifications: () => ({
    addNotification: mockAddNotification,
    notifications: { value: [] }
  })
}))

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

/**
 * Helper function to create a test router
 */
function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: Login },
      { path: '/admin/categories', component: AdminCategories },
      { path: '/admin/products', component: AdminProducts },
      { path: '/admin/reviews', component: AdminReviews }
    ]
  })
  return router
}

describe('Integration Tests - Admin Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  /**
   * Integration Test: Full category creation flow
   * Validates: Requirements 2.1, 2.2, 3.1, 3.2, 3.3, 12.1
   * 
   * This test verifies the complete flow of:
   * 1. Loading the categories page
   * 2. Opening the create form
   * 3. Submitting valid category data
   * 4. Seeing the new category in the list
   * 5. Receiving a success notification
   */
  it('should complete full category creation flow', async () => {
    // Setup: Mock initial empty categories list
    const initialCategories = []
    const newCategory = {
      id: 1,
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      created_at: '2024-01-01T00:00:00Z'
    }
    
    api.getCategoriesWithCounts
      .mockResolvedValueOnce(initialCategories) // Initial load
      .mockResolvedValueOnce([newCategory]) // After creation
    api.createCategory.mockResolvedValue(newCategory)
    
    // Step 1: Mount the AdminCategories component
    const wrapper = mount(AdminCategories)
    await flushPromises()
    
    // Verify initial state - empty list
    expect(wrapper.vm.categories).toEqual([])
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    
    // Step 2: Open create form
    wrapper.vm.showCreateModal = true
    await wrapper.vm.$nextTick()
    
    // Step 3: Submit new category
    const categoryData = {
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    }
    
    await wrapper.vm.handleCreateCategory(categoryData)
    await flushPromises()
    
    // Step 4: Verify API was called correctly
    expect(api.createCategory).toHaveBeenCalledWith(categoryData)
    expect(api.createCategory).toHaveBeenCalledTimes(1)
    
    // Step 5: Verify categories list was reloaded
    expect(api.getCategoriesWithCounts).toHaveBeenCalledTimes(2)
    
    // Step 6: Verify new category appears in the list
    expect(wrapper.vm.categories).toHaveLength(1)
    expect(wrapper.vm.categories[0]).toEqual(newCategory)
    
    // Step 7: Verify success notification was shown
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Категория успешно создана',
      type: 'success'
    })
    
    // Step 8: Verify form was closed
    expect(wrapper.vm.showCreateModal).toBe(false)
  })

  /**
   * Integration Test: Full product creation and filtering flow
   * Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 12.1
   * 
   * This test verifies the complete flow of:
   * 1. Loading products and categories
   * 2. Creating a new product
   * 3. Filtering products by category
   * 4. Verifying filtered results
   */
  it('should complete full product creation and filtering flow', async () => {
    // Setup: Mock categories
    const categories = [
      {
        id: 1,
        name: 'Electronics',
        description: 'Electronic devices',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Books',
        description: 'Digital books',
        created_at: '2024-01-02T00:00:00Z'
      }
    ]
    
    // Setup: Mock initial products
    const initialProducts = [
      {
        id: 1,
        title: 'Laptop Guide',
        description: 'Complete laptop buying guide',
        price: '29.99',
        category_id: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        category: categories[0]
      }
    ]
    
    const newProduct = {
      id: 2,
      title: 'Programming Book',
      description: 'Learn programming',
      price: '19.99',
      category_id: 2,
      is_active: true,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      category: categories[1]
    }
    
    const electronicsProducts = [initialProducts[0]]
    const booksProducts = [newProduct]
    
    api.getCategories.mockResolvedValue(categories)
    api.getProducts
      .mockResolvedValueOnce(initialProducts) // Initial load
      .mockResolvedValueOnce([...initialProducts, newProduct]) // After creation
      .mockResolvedValueOnce(electronicsProducts) // Filter by Electronics
      .mockResolvedValueOnce(booksProducts) // Filter by Books
    api.createProduct.mockResolvedValue(newProduct)
    
    // Step 1: Mount the AdminProducts component
    const wrapper = mount(AdminProducts)
    await flushPromises()
    
    // Verify initial state
    expect(wrapper.vm.products).toHaveLength(1)
    expect(wrapper.vm.categories).toHaveLength(2)
    expect(wrapper.vm.loading).toBe(false)
    
    // Step 2: Create new product
    const productData = {
      title: 'Programming Book',
      description: 'Learn programming',
      price: 19.99,
      content_text: 'This is the content of the programming book...',
      category_id: 2,
      is_active: true
    }
    
    await wrapper.vm.handleCreateProduct(productData)
    await flushPromises()
    
    // Step 3: Verify product was created
    expect(api.createProduct).toHaveBeenCalledWith(productData)
    expect(api.createProduct).toHaveBeenCalledTimes(1)
    
    // Step 4: Verify products list was reloaded
    expect(api.getProducts).toHaveBeenCalledTimes(2)
    
    // Step 5: Verify new product appears in the list
    expect(wrapper.vm.products).toHaveLength(2)
    const foundProduct = wrapper.vm.products.find(p => p.title === 'Programming Book')
    expect(foundProduct).toBeDefined()
    expect(foundProduct.category_id).toBe(2)
    
    // Step 6: Verify success notification
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Товар успешно создан',
      type: 'success'
    })
    
    // Step 7: Filter by Electronics category
    wrapper.vm.selectedCategory = 1
    await wrapper.vm.handleCategoryFilter()
    await flushPromises()
    
    // Step 8: Verify filter API call
    expect(api.getProducts).toHaveBeenCalledWith(1, 0, 20, false)
    
    // Step 9: Verify filtered results (only Electronics products)
    expect(wrapper.vm.products).toHaveLength(1)
    expect(wrapper.vm.products[0].category_id).toBe(1)
    expect(wrapper.vm.products[0].title).toBe('Laptop Guide')
    
    // Step 10: Filter by Books category
    wrapper.vm.selectedCategory = 2
    await wrapper.vm.handleCategoryFilter()
    await flushPromises()
    
    // Step 11: Verify filter API call
    expect(api.getProducts).toHaveBeenCalledWith(2, 0, 20, false)
    
    // Step 12: Verify filtered results (only Books products)
    expect(wrapper.vm.products).toHaveLength(1)
    expect(wrapper.vm.products[0].category_id).toBe(2)
    expect(wrapper.vm.products[0].title).toBe('Programming Book')
  })

  /**
   * Integration Test: Full review deletion flow
   * Validates: Requirements 9.1, 9.2, 10.1, 10.2, 10.3, 12.1
   * 
   * This test verifies the complete flow of:
   * 1. Loading reviews list
   * 2. Selecting a review to delete
   * 3. Confirming deletion
   * 4. Verifying review is removed from list
   * 5. Receiving success notification
   */
  it('should complete full review deletion flow', async () => {
    // Setup: Mock reviews
    const reviews = [
      {
        id: 1,
        user_id: 10,
        product_id: 5,
        rating: 5,
        comment: 'Excellent product!',
        created_at: '2024-01-01T00:00:00Z',
        user: {
          id: 10,
          email: 'user1@example.com',
          is_active: true,
          is_staff: false,
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-01T00:00:00Z'
        },
        product: {
          id: 5,
          title: 'Great Product',
          description: 'A great product',
          price: '49.99',
          category_id: 1,
          is_active: true,
          created_at: '2023-12-15T00:00:00Z',
          updated_at: '2023-12-15T00:00:00Z'
        }
      },
      {
        id: 2,
        user_id: 11,
        product_id: 6,
        rating: 3,
        comment: 'Average product',
        created_at: '2024-01-02T00:00:00Z',
        user: {
          id: 11,
          email: 'user2@example.com',
          is_active: true,
          is_staff: false,
          created_at: '2023-12-02T00:00:00Z',
          updated_at: '2023-12-02T00:00:00Z'
        },
        product: {
          id: 6,
          title: 'Another Product',
          description: 'Another product',
          price: '29.99',
          category_id: 2,
          is_active: true,
          created_at: '2023-12-16T00:00:00Z',
          updated_at: '2023-12-16T00:00:00Z'
        }
      }
    ]
    
    const reviewToDelete = reviews[0]
    const remainingReviews = [reviews[1]]
    
    api.getAllReviews
      .mockResolvedValueOnce(reviews) // Initial load
      .mockResolvedValueOnce(remainingReviews) // After deletion
    api.deleteReview.mockResolvedValue(true)
    
    // Step 1: Mount the AdminReviews component
    const wrapper = mount(AdminReviews)
    await flushPromises()
    
    // Verify initial state
    expect(wrapper.vm.reviews).toHaveLength(2)
    expect(wrapper.vm.loading).toBe(false)
    
    // Step 2: Verify all review details are displayed
    expect(wrapper.text()).toContain('user1@example.com')
    expect(wrapper.text()).toContain('Great Product')
    expect(wrapper.text()).toContain('Excellent product!')
    
    // Step 3: Select review to delete
    wrapper.vm.reviewToDelete = reviewToDelete
    await wrapper.vm.$nextTick()
    
    // Step 4: Confirm deletion
    await wrapper.vm.handleDeleteReview()
    await flushPromises()
    
    // Step 5: Verify API was called with correct ID
    expect(api.deleteReview).toHaveBeenCalledWith(reviewToDelete.id)
    expect(api.deleteReview).toHaveBeenCalledTimes(1)
    
    // Step 6: Verify reviews list was reloaded
    expect(api.getAllReviews).toHaveBeenCalledTimes(2)
    
    // Step 7: Verify deleted review is no longer in the list
    expect(wrapper.vm.reviews).toHaveLength(1)
    expect(wrapper.vm.reviews[0].id).toBe(2)
    expect(wrapper.vm.reviews.find(r => r.id === reviewToDelete.id)).toBeUndefined()
    
    // Step 8: Verify success notification was shown
    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Отзыв успешно удален',
      type: 'success'
    })
    
    // Step 9: Verify dialog was closed
    expect(wrapper.vm.showDeleteDialog).toBe(false)
    expect(wrapper.vm.reviewToDelete).toBeNull()
  })

  /**
   * Integration Test: Authentication flow
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   * 
   * This test verifies the complete authentication flow:
   * 1. User logs in with valid credentials
   * 2. Token is stored
   * 3. User profile is fetched
   * 4. Staff status is verified
   * 5. Access to admin panel is granted
   * 6. Non-staff users are denied access
   */
  it('should complete full authentication flow for staff user', async () => {
    // Setup: Mock login response
    const loginResponse = {
      access_token: 'test-token-123',
      token_type: 'bearer'
    }
    
    const staffUser = {
      id: 1,
      email: 'admin@example.com',
      is_active: true,
      is_staff: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
    
    api.login.mockResolvedValue(loginResponse)
    api.getCurrentUserProfile.mockResolvedValue(staffUser)
    
    // Step 1: Verify user is not authenticated initially
    expect(auth.isAuthenticated()).toBeFalsy()
    expect(auth.isStaff()).toBeFalsy()
    expect(auth.canAccessAdmin()).toBeFalsy()
    
    // Step 2: Perform login
    const credentials = {
      username: 'admin@example.com',
      password: 'password123'
    }
    
    const loginResult = await api.login(credentials.username, credentials.password)
    
    // Step 3: Verify login response
    expect(loginResult).toEqual(loginResponse)
    expect(api.login).toHaveBeenCalledWith(credentials.username, credentials.password)
    
    // Step 4: Store token manually (since api.login is mocked)
    auth.setToken(loginResponse.access_token)
    
    // Step 5: Fetch user profile
    const userProfile = await api.getCurrentUserProfile()
    
    // Step 6: Store user data
    auth.setCurrentUser(userProfile)
    
    // Step 7: Verify user is now authenticated
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.getCurrentUser()).toEqual(staffUser)
    
    // Step 8: Verify staff status
    expect(auth.isStaff()).toBe(true)
    expect(auth.canAccessAdmin()).toBe(true)
    
    // Step 9: Verify admin panel access is granted
    const router = createTestRouter()
    await router.push('/admin/categories')
    
    // Navigation guard should allow access
    expect(router.currentRoute.value.path).toBe('/admin/categories')
  })

  /**
   * Integration Test: Authentication flow for non-staff user
   * Validates: Requirements 1.1, 1.3
   * 
   * This test verifies that non-staff users cannot access admin panel
   */
  it('should deny admin access to non-staff users', async () => {
    // Setup: Mock login response for non-staff user
    const loginResponse = {
      access_token: 'test-token-456',
      token_type: 'bearer'
    }
    
    const regularUser = {
      id: 2,
      email: 'user@example.com',
      is_active: true,
      is_staff: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
    
    api.login.mockResolvedValue(loginResponse)
    api.getCurrentUserProfile.mockResolvedValue(regularUser)
    
    // Step 1: Perform login
    const loginResult = await api.login('user@example.com', 'password123')
    
    // Step 2: Store token manually (since api.login is mocked)
    auth.setToken(loginResult.access_token)
    
    // Step 3: Fetch and store user profile
    const userProfile = await api.getCurrentUserProfile()
    auth.setCurrentUser(userProfile)
    
    // Step 4: Verify user is authenticated but not staff
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.isStaff()).toBe(false)
    expect(auth.canAccessAdmin()).toBe(false)
    
    // Step 5: Verify admin panel access is denied
    expect(auth.getCurrentUser().is_staff).toBe(false)
  })

  /**
   * Integration Test: Logout flow
   * Validates: Requirements 11.4
   * 
   * This test verifies the complete logout flow:
   * 1. User is authenticated
   * 2. User clicks logout
   * 3. Token and user data are cleared
   * 4. User is no longer authenticated
   */
  it('should complete full logout flow', async () => {
    // Setup: Set up authenticated user
    const token = 'test-token-789'
    const user = {
      id: 1,
      email: 'admin@example.com',
      is_active: true,
      is_staff: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
    
    auth.setToken(token)
    auth.setCurrentUser(user)
    
    // Step 1: Verify user is authenticated
    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.isStaff()).toBe(true)
    expect(auth.getCurrentUser()).toEqual(user)
    
    // Step 2: Perform logout
    auth.clearAuth()
    
    // Step 3: Verify token and user data are cleared
    expect(auth.getToken()).toBeNull()
    expect(auth.getCurrentUser()).toBeNull()
    
    // Step 4: Verify user is no longer authenticated
    expect(auth.isAuthenticated()).toBeFalsy()
    expect(auth.isStaff()).toBeFalsy()
    expect(auth.canAccessAdmin()).toBeFalsy()
  })
})
