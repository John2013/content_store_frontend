/**
 * Unit tests for navigation guard
 * Requirements: 1.1, 1.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as auth from '../services/auth.js'

// Mock the auth module
vi.mock('../services/auth.js', () => ({
  isAuthenticated: vi.fn(),
  isStaff: vi.fn()
}))

// Mock components
const mockComponent = { template: '<div>Mock</div>' }

/**
 * Create a test router with the same configuration as the real router
 */
function createTestRouter() {
  const routes = [
    { path: '/', component: mockComponent },
    { path: '/login', component: mockComponent },
    {
      path: '/admin',
      component: mockComponent,
      meta: { requiresAuth: true, requiresStaff: true },
      children: [
        { 
          path: '', 
          component: mockComponent,
          meta: { requiresAuth: true, requiresStaff: true }
        },
        { 
          path: 'categories', 
          component: mockComponent,
          meta: { requiresAuth: true, requiresStaff: true }
        }
      ]
    }
  ]

  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })

  // Apply the same navigation guard as the real router
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
      if (!auth.isAuthenticated()) {
        return next('/login')
      }
    }
    
    if (to.meta.requiresStaff) {
      if (!auth.isStaff()) {
        return next('/')
      }
    }
    
    next()
  })

  return router
}

describe('Navigation Guard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('Unauthenticated users', () => {
    it('should redirect unauthenticated users to login when accessing admin routes', async () => {
      // Requirement 1.1: Redirect unauthenticated users to login
      auth.isAuthenticated.mockReturnValue(false)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should redirect unauthenticated users to login when accessing admin child routes', async () => {
      // Requirement 1.1: Redirect unauthenticated users to login
      auth.isAuthenticated.mockReturnValue(false)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/admin/categories')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should allow unauthenticated users to access public routes', async () => {
      auth.isAuthenticated.mockReturnValue(false)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should allow unauthenticated users to access login page', async () => {
      auth.isAuthenticated.mockReturnValue(false)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('Non-staff users', () => {
    it('should redirect authenticated non-staff users to home when accessing admin routes', async () => {
      // Requirement 1.3: Prevent non-staff users from accessing admin panel
      auth.isAuthenticated.mockReturnValue(true)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should redirect authenticated non-staff users to home when accessing admin child routes', async () => {
      // Requirement 1.3: Prevent non-staff users from accessing admin panel
      auth.isAuthenticated.mockReturnValue(true)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/admin/categories')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('should allow authenticated non-staff users to access public routes', async () => {
      auth.isAuthenticated.mockReturnValue(true)
      auth.isStaff.mockReturnValue(false)

      const router = createTestRouter()
      
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('Staff users', () => {
    it('should allow authenticated staff users to access admin routes', async () => {
      // Test that staff users can access admin panel
      auth.isAuthenticated.mockReturnValue(true)
      auth.isStaff.mockReturnValue(true)

      const router = createTestRouter()
      
      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/admin')
    })

    it('should allow authenticated staff users to access admin child routes', async () => {
      // Test that staff users can access admin child routes
      auth.isAuthenticated.mockReturnValue(true)
      auth.isStaff.mockReturnValue(true)

      const router = createTestRouter()
      
      await router.push('/admin/categories')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/admin/categories')
    })

    it('should allow authenticated staff users to access public routes', async () => {
      auth.isAuthenticated.mockReturnValue(true)
      auth.isStaff.mockReturnValue(true)

      const router = createTestRouter()
      
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
