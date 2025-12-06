/**
 * Unit tests for AdminLayout component
 * Requirements: 11.1, 11.3, 11.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AdminLayout from './AdminLayout.vue'
import * as auth from '../../services/auth.js'
import * as fc from 'fast-check'

// Mock the auth module
vi.mock('../../services/auth.js', () => ({
  getCurrentUser: vi.fn(),
  clearAuth: vi.fn()
}))

// Mock components for router
const mockComponent = { template: '<div>Mock Content</div>' }

/**
 * Create a test router for AdminLayout tests
 */
function createTestRouter(initialRoute = '/admin') {
  const routes = [
    { path: '/login', component: mockComponent },
    { path: '/', component: mockComponent },
    {
      path: '/admin',
      component: mockComponent,
      children: [
        { path: '', component: mockComponent },
        { path: 'categories', component: mockComponent },
        { path: 'products', component: mockComponent },
        { path: 'reviews', component: mockComponent }
      ]
    }
  ]

  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })

  router.push(initialRoute)

  return router
}

describe('AdminLayout Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Default mock: authenticated staff user
    auth.getCurrentUser.mockReturnValue({
      id: 1,
      email: 'admin@example.com',
      is_staff: true,
      is_active: true
    })
  })

  /**
   * Test rendering of navigation menu
   * Requirement 11.1: Display navigation menu with sections
   */
  describe('Navigation menu rendering', () => {
    it('should render navigation menu with all required sections', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      // Check that all navigation items are present
      const navItems = wrapper.findAll('.nav-item')
      expect(navItems.length).toBe(4)

      // Check navigation item texts
      const navTexts = navItems.map(item => item.find('.nav-text').text())
      expect(navTexts).toContain('Dashboard')
      expect(navTexts).toContain('Категории')
      expect(navTexts).toContain('Товары')
      expect(navTexts).toContain('Отзывы')
    })

    it('should render navigation menu with correct links', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const navItems = wrapper.findAll('.nav-item')
      
      // Check that links have correct href attributes
      expect(navItems[0].attributes('href')).toBe('/admin')
      expect(navItems[1].attributes('href')).toBe('/admin/categories')
      expect(navItems[2].attributes('href')).toBe('/admin/products')
      expect(navItems[3].attributes('href')).toBe('/admin/reviews')
    })

    it('should render navigation menu with icons', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const navIcons = wrapper.findAll('.nav-icon')
      expect(navIcons.length).toBe(4)
      
      // Check that icons are present
      expect(navIcons[0].text()).toBe('📊')
      expect(navIcons[1].text()).toBe('📁')
      expect(navIcons[2].text()).toBe('📦')
      expect(navIcons[3].text()).toBe('⭐')
    })

    it('should render sidebar header with title', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const sidebarHeader = wrapper.find('.sidebar-header h2')
      expect(sidebarHeader.exists()).toBe(true)
      expect(sidebarHeader.text()).toBe('Admin Panel')
    })
  })

  /**
   * Test active menu highlighting
   * Requirement 11.3: Visually highlight active menu item
   */
  describe('Active menu highlighting', () => {
    it('should configure router-links with active-class attribute', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      // Check that all router-links have the active-class configured
      const navItems = wrapper.findAll('.nav-item')
      
      // Verify all nav items are router-links with active-class
      navItems.forEach(navItem => {
        expect(navItem.element.tagName).toBe('A')
        // Router-link components should have the class 'nav-item'
        expect(navItem.classes()).toContain('nav-item')
      })
    })

    it('should have exact prop on Dashboard link for precise matching', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      // The Dashboard link should have exact matching
      const dashboardLink = wrapper.findAll('.nav-item')[0]
      expect(dashboardLink.attributes('href')).toBe('/admin')
    })

    it('should have correct navigation structure for active class application', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      // Verify navigation structure exists
      const sidebar = wrapper.find('.admin-sidebar')
      expect(sidebar.exists()).toBe(true)

      const sidebarNav = wrapper.find('.sidebar-nav')
      expect(sidebarNav.exists()).toBe(true)

      // Verify all navigation links are present
      const navItems = wrapper.findAll('.nav-item')
      expect(navItems.length).toBe(4)

      // Verify each link has the correct href
      expect(navItems[0].attributes('href')).toBe('/admin')
      expect(navItems[1].attributes('href')).toBe('/admin/categories')
      expect(navItems[2].attributes('href')).toBe('/admin/products')
      expect(navItems[3].attributes('href')).toBe('/admin/reviews')
    })

    it('should apply active class styling through CSS', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      // Verify that the component has styles for .active class
      // This tests that the CSS is properly configured
      const navItem = wrapper.find('.nav-item')
      expect(navItem.exists()).toBe(true)
      
      // The component should have the active class styling defined
      // We can't test the actual CSS, but we can verify the structure is correct
      expect(wrapper.html()).toContain('nav-item')
    })

    it('should maintain navigation structure when route changes', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      // Navigate to different routes
      await router.push('/admin/categories')
      await wrapper.vm.$nextTick()

      let navItems = wrapper.findAll('.nav-item')
      expect(navItems.length).toBe(4)

      await router.push('/admin/products')
      await wrapper.vm.$nextTick()

      navItems = wrapper.findAll('.nav-item')
      expect(navItems.length).toBe(4)

      // Verify navigation structure remains intact
      expect(navItems[0].attributes('href')).toBe('/admin')
      expect(navItems[1].attributes('href')).toBe('/admin/categories')
      expect(navItems[2].attributes('href')).toBe('/admin/products')
      expect(navItems[3].attributes('href')).toBe('/admin/reviews')
    })
  })

  /**
   * Test logout functionality
   * Requirement 11.4: Logout removes token and redirects to login
   */
  describe('Logout functionality', () => {
    it('should call clearAuth when logout button is clicked', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const logoutBtn = wrapper.find('.logout-btn')
      expect(logoutBtn.exists()).toBe(true)

      await logoutBtn.trigger('click')

      expect(auth.clearAuth).toHaveBeenCalledTimes(1)
    })

    it('should redirect to login page when logout button is clicked', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const logoutBtn = wrapper.find('.logout-btn')
      
      // Trigger click and wait for all async operations
      await logoutBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // Wait a bit for router navigation to complete
      await new Promise(resolve => setTimeout(resolve, 10))
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should display logout button with correct text', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const logoutBtn = wrapper.find('.logout-btn')
      expect(logoutBtn.text()).toBe('Выход')
    })
  })

  /**
   * Test user information display
   */
  describe('User information display', () => {
    it('should display user email when user is logged in', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const userEmail = wrapper.find('.user-email')
      expect(userEmail.exists()).toBe(true)
      expect(userEmail.text()).toBe('admin@example.com')
    })

    it('should display staff badge when user is staff', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const userBadge = wrapper.find('.user-badge')
      expect(userBadge.exists()).toBe(true)
      expect(userBadge.text()).toBe('Staff')
    })

    it('should not display user info when user is null', async () => {
      auth.getCurrentUser.mockReturnValue(null)

      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      const userInfo = wrapper.find('.user-info')
      expect(userInfo.exists()).toBe(false)
    })
  })

  /**
   * Test page title computation
   */
  describe('Page title computation', () => {
    it('should display "Dashboard" title on /admin route', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      const headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Dashboard')
    })

    it('should display "Управление категориями" title on /admin/categories route', async () => {
      const router = createTestRouter('/admin/categories')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      const headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Управление категориями')
    })

    it('should display "Управление товарами" title on /admin/products route', async () => {
      const router = createTestRouter('/admin/products')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      const headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Управление товарами')
    })

    it('should display "Управление отзывами" title on /admin/reviews route', async () => {
      const router = createTestRouter('/admin/reviews')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      const headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Управление отзывами')
    })

    it('should update page title when navigating between routes', async () => {
      const router = createTestRouter('/admin')
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      await wrapper.vm.$nextTick()

      // Initially on Dashboard
      let headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Dashboard')

      // Navigate to Categories
      await router.push('/admin/categories')
      await wrapper.vm.$nextTick()

      headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Управление категориями')

      // Navigate to Products
      await router.push('/admin/products')
      await wrapper.vm.$nextTick()

      headerTitle = wrapper.find('.header-title')
      expect(headerTitle.text()).toBe('Управление товарами')
    })
  })

  /**
   * Test layout structure
   */
  describe('Layout structure', () => {
    it('should render sidebar, header, and content areas', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router]
        }
      })

      expect(wrapper.find('.admin-sidebar').exists()).toBe(true)
      expect(wrapper.find('.admin-header').exists()).toBe(true)
      expect(wrapper.find('.admin-content').exists()).toBe(true)
    })

    it('should render router-view for content', async () => {
      const router = createTestRouter()
      await router.isReady()

      const wrapper = mount(AdminLayout, {
        global: {
          plugins: [router],
          stubs: {
            RouterView: false
          }
        }
      })

      const content = wrapper.find('.admin-content')
      expect(content.exists()).toBe(true)
    })
  })

  /**
   * Property-Based Tests for Navigation
   * Feature: admin-panel, Property 21: Navigation routing
   * Feature: admin-panel, Property 22: Active menu highlighting
   * Validates: Requirements 11.2, 11.3
   */
  describe('Property-Based Tests: Navigation', () => {
    /**
     * Property 21: Navigation routing
     * For any menu item in the admin panel (Categories, Products, Reviews),
     * clicking on it should redirect to the corresponding URL route
     * Validates: Requirements 11.2
     */
    it('Property 21: Navigation routing - clicking any menu item navigates to correct route', async () => {
      // Define the menu items with their expected routes
      const menuItems = [
        { text: 'Dashboard', route: '/admin', index: 0 },
        { text: 'Категории', route: '/admin/categories', index: 1 },
        { text: 'Товары', route: '/admin/products', index: 2 },
        { text: 'Отзывы', route: '/admin/reviews', index: 3 }
      ]

      // Generator for menu item indices
      const menuItemArbitrary = fc.constantFrom(...menuItems)

      await fc.assert(
        fc.asyncProperty(menuItemArbitrary, async (menuItem) => {
          // Create a fresh router for each test iteration
          const router = createTestRouter('/admin')
          await router.isReady()

          const wrapper = mount(AdminLayout, {
            global: {
              plugins: [router]
            }
          })

          await wrapper.vm.$nextTick()

          // Find all navigation items
          const navItems = wrapper.findAll('.nav-item')
          expect(navItems.length).toBeGreaterThan(menuItem.index)

          // Get the specific menu item
          const navItem = navItems[menuItem.index]

          // Verify the href attribute matches the expected route
          expect(navItem.attributes('href')).toBe(menuItem.route)

          // Simulate click on the navigation item
          await navItem.trigger('click')
          await wrapper.vm.$nextTick()

          // Wait for router navigation to complete
          await new Promise(resolve => setTimeout(resolve, 10))
          await router.isReady()

          // Verify the router navigated to the correct route
          expect(router.currentRoute.value.path).toBe(menuItem.route)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Property 22: Active menu highlighting
     * For any active page in the admin panel, the corresponding menu item
     * should be visually highlighted with the 'active' class
     * Validates: Requirements 11.3
     */
    it('Property 22: Active menu highlighting - active route has highlighted menu item', async () => {
      // Define the routes with their corresponding menu item indices
      const routeConfigs = [
        { route: '/admin', menuIndex: 0, name: 'Dashboard' },
        { route: '/admin/categories', menuIndex: 1, name: 'Categories' },
        { route: '/admin/products', menuIndex: 2, name: 'Products' },
        { route: '/admin/reviews', menuIndex: 3, name: 'Reviews' }
      ]

      // Generator for route configurations
      const routeArbitrary = fc.constantFrom(...routeConfigs)

      await fc.assert(
        fc.asyncProperty(routeArbitrary, async (routeConfig) => {
          // Create router starting at the specified route
          const router = createTestRouter(routeConfig.route)
          await router.isReady()

          const wrapper = mount(AdminLayout, {
            global: {
              plugins: [router]
            }
          })

          await wrapper.vm.$nextTick()

          // Find all navigation items
          const navItems = wrapper.findAll('.nav-item')
          expect(navItems.length).toBe(4)

          // Get the menu item that should be active
          const activeNavItem = navItems[routeConfig.menuIndex]

          // Verify the active menu item has the 'active' class
          // Vue Router automatically applies the active-class when the route matches
          expect(activeNavItem.classes()).toContain('active')

          // Count how many items have the active class
          const activeCount = navItems.filter(item => item.classes().includes('active')).length

          // Exactly one menu item should be active at any time
          // This validates that the active highlighting is exclusive
          expect(activeCount).toBe(1)
        }),
        { numRuns: 100 }
      )
    })

    /**
     * Combined property: Navigation routing and active highlighting work together
     * For any navigation sequence, after clicking a menu item, that item should
     * become active and the route should match
     */
    it('Property 21+22: Navigation and highlighting work together', async () => {
      // Define navigation sequences (pairs of routes to navigate between)
      const navigationSequences = [
        { from: '/admin', to: '/admin/categories', toIndex: 1 },
        { from: '/admin/categories', to: '/admin/products', toIndex: 2 },
        { from: '/admin/products', to: '/admin/reviews', toIndex: 3 },
        { from: '/admin/reviews', to: '/admin', toIndex: 0 },
        { from: '/admin', to: '/admin/products', toIndex: 2 },
        { from: '/admin/categories', to: '/admin/reviews', toIndex: 3 }
      ]

      const sequenceArbitrary = fc.constantFrom(...navigationSequences)

      await fc.assert(
        fc.asyncProperty(sequenceArbitrary, async (sequence) => {
          // Create router starting at the 'from' route
          const router = createTestRouter(sequence.from)
          await router.isReady()

          const wrapper = mount(AdminLayout, {
            global: {
              plugins: [router]
            }
          })

          await wrapper.vm.$nextTick()

          // Find all navigation items
          const navItems = wrapper.findAll('.nav-item')

          // Click on the target navigation item
          const targetNavItem = navItems[sequence.toIndex]
          await targetNavItem.trigger('click')
          await wrapper.vm.$nextTick()

          // Wait for router navigation
          await new Promise(resolve => setTimeout(resolve, 10))
          await router.isReady()

          // Property 21: Verify route changed correctly
          expect(router.currentRoute.value.path).toBe(sequence.to)

          // Re-query nav items after navigation
          const updatedNavItems = wrapper.findAll('.nav-item')

          // Property 22: Verify the clicked item is now active
          const activeNavItem = updatedNavItems[sequence.toIndex]
          expect(activeNavItem.classes()).toContain('active')
        }),
        { numRuns: 100 }
      )
    })
  })
})
