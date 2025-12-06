<template>
  <div class="admin-layout">
    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link 
          to="/admin" 
          class="nav-item"
          active-class=""
          exact-active-class="active"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-text">Dashboard</span>
        </router-link>
        <router-link 
          to="/admin/categories" 
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">📁</span>
          <span class="nav-text">Категории</span>
        </router-link>
        <router-link 
          to="/admin/products" 
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">📦</span>
          <span class="nav-text">Товары</span>
        </router-link>
        <router-link 
          to="/admin/reviews" 
          class="nav-item"
          active-class="active"
        >
          <span class="nav-icon">⭐</span>
          <span class="nav-text">Отзывы</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <div class="admin-main">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-content">
          <h1 class="header-title">{{ pageTitle }}</h1>
          <div class="header-actions">
            <div class="user-info" v-if="user">
              <span class="user-email">{{ user.email }}</span>
              <span class="user-badge">Staff</span>
            </div>
            <button @click="handleLogout" class="logout-btn">
              Выход
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { getCurrentUser, clearAuth } from '../../services/auth.js'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

export default {
  name: 'AdminLayout',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const user = getCurrentUser()

    // Compute page title based on current route
    const pageTitle = computed(() => {
      const path = route.path
      if (path === '/admin') return 'Dashboard'
      if (path.includes('/categories')) return 'Управление категориями'
      if (path.includes('/products')) return 'Управление товарами'
      if (path.includes('/reviews')) return 'Управление отзывами'
      return 'Admin Panel'
    })

    /**
     * Handle user logout
     * Requirements: 11.4
     */
    const handleLogout = () => {
      clearAuth()
      router.push('/login')
    }

    return {
      user,
      pageTitle,
      handleLogout
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* Sidebar Styles */
.admin-sidebar {
  width: 250px;
  background: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-left-color: #60a5fa;
}

.nav-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 15px;
  font-weight: 500;
}

/* Main Content Area */
.admin-main {
  flex: 1;
  margin-left: 250px;
  display: flex;
  flex-direction: column;
}

/* Header Styles */
.admin-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
}

.header-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 8px;
}

.user-email {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.user-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  font-weight: 600;
}

.logout-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #dc2626;
}

/* Content Area */
.admin-content {
  flex: 1;
  padding: 32px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-sidebar {
    width: 200px;
  }

  .admin-main {
    margin-left: 200px;
  }

  .sidebar-header h2 {
    font-size: 18px;
  }

  .nav-text {
    font-size: 14px;
  }

  .header-content {
    padding: 16px 20px;
  }

  .header-title {
    font-size: 20px;
  }

  .admin-content {
    padding: 20px;
  }
}

@media (max-width: 640px) {
  .admin-sidebar {
    width: 60px;
  }

  .admin-main {
    margin-left: 60px;
  }

  .sidebar-header h2,
  .nav-text {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
  }

  .user-email {
    display: none;
  }

  .header-title {
    font-size: 18px;
  }
}
</style>
