<template>
  <div id="app">
    <header class="site-header">
      <router-link to="/" class="logo">TextStore</router-link>
      <nav>
        <router-link to="/">Каталог</router-link>
        <router-link to="/cart">Корзина ({{ cartCount }})</router-link>
        <router-link v-if="user && user.is_staff" to="/admin">Админ-панель</router-link>
        <router-link v-if="!user" to="/login">Войти</router-link>
        <button v-if="user" @click="logout" class="btn-ghost">Выйти</button>
      </nav>
    </header>

    <main class="container">
      <router-view @update-cart="fetchCart" />
    </main>

    <footer class="site-footer">
      Простая демо‑витрина цифровых текстов — оплата симулируется.
    </footer>

    <!-- Notification Toasts -->
    <div class="notifications-container">
      <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        @close="removeNotification(notification.id)"
      />
    </div>
  </div>
</template>

<script>
import api from './services/api'
import NotificationToast from './components/NotificationToast.vue'
import { useNotifications } from './composables/useNotifications.js'
import * as auth from './services/auth'

export default {
  name: 'App',
  components: {
    NotificationToast
  },
  setup() {
    const { notifications, removeNotification } = useNotifications()
    return {
      notifications,
      removeNotification
    }
  },
  data() {
    return {
      cartCount: 0,
      user: null
    }
  },
  async created() {
    // Load user data from localStorage or fetch from API if token exists
    await this.loadUserData()
    await this.fetchCart()
  },
  methods: {
    async loadUserData() {
      // First try to get user from localStorage
      this.user = auth.getCurrentUser()
      
      // If we have a token but no user data, fetch from API
      if (auth.isAuthenticated() && !this.user) {
        try {
          const userData = await api.getCurrentUserProfile()
          auth.setCurrentUser(userData)
          this.user = userData
        } catch (e) {
          console.error('Failed to load user profile:', e)
          // If token is invalid, clear auth data
          auth.clearAuth()
          this.user = null
        }
      }
    },
    async fetchCart() {
      try {
        const cart = await api.getCart()
        this.cartCount = cart?.length || 0
      } catch (e) {
        this.cartCount = 0
      }
    },
    logout() {
      auth.clearAuth()
      this.user = null
      this.cartCount = 0
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.site-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:1rem;
  background:#0b74da;
  color:#fff;
}
.logo{ font-weight:700; color:#fff; text-decoration:none }
nav a{ color:#fff; margin-right:1rem; text-decoration:none }
.btn-ghost{ background:transparent; border:1px solid rgba(255,255,255,0.3); color:#fff; padding:.4rem .6rem }
.container{ padding:2rem }
.site-footer{ text-align:center; padding:1rem; color:#666; border-top:1px solid #eee }

.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notifications-container > * {
  pointer-events: auto;
}
</style>
