import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Product from '../views/Product.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import Login from '../views/Login.vue'
import Purchases from '../views/Purchases.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import AdminCategories from '../views/admin/AdminCategories.vue'
import AdminProducts from '../views/admin/AdminProducts.vue'
import AdminReviews from '../views/admin/AdminReviews.vue'
import { isAuthenticated, isStaff } from '../services/auth.js'

const routes = [
  { path: '/', component: Home },
  { path: '/product/:id', component: Product, props: true },
  { path: '/cart', component: Cart },
  { path: '/checkout', component: Checkout },
  { path: '/login', component: Login },
  { path: '/purchases', component: Purchases },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresStaff: true },
    children: [
      { 
        path: '', 
        component: AdminDashboard,
        meta: { requiresAuth: true, requiresStaff: true }
      },
      { 
        path: 'categories', 
        component: AdminCategories,
        meta: { requiresAuth: true, requiresStaff: true }
      },
      { 
        path: 'products', 
        component: AdminProducts,
        meta: { requiresAuth: true, requiresStaff: true }
      },
      { 
        path: 'reviews', 
        component: AdminReviews,
        meta: { requiresAuth: true, requiresStaff: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * Navigation guard for authentication and authorization
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */
router.beforeEach((to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      // Requirement 1.1: Redirect unauthenticated users to login
      return next('/login')
    }
  }
  
  // Check if route requires staff permissions
  if (to.meta.requiresStaff) {
    if (!isStaff()) {
      // Redirect to home if user doesn't have staff permissions
      // Requirement 1.3: Prevent non-staff users from accessing admin panel
      return next('/')
    }
  }
  
  // Allow navigation
  next()
})

export default router
