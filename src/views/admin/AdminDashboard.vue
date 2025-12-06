<template>
  <div class="admin-dashboard">
    <!-- Welcome Section -->
    <div class="welcome-card">
      <h2 class="welcome-title">Добро пожаловать в панель управления</h2>
      <p class="welcome-text">
        Здесь вы можете управлять категориями, товарами и отзывами вашего магазина цифрового контента.
      </p>
    </div>

    <!-- Quick Links Section -->
    <div class="quick-links">
      <h3 class="section-title">Основные разделы</h3>
      <div class="links-grid">
        <router-link to="/admin/categories" class="link-card">
          <div class="link-icon">📁</div>
          <h4 class="link-title">Категории</h4>
          <p class="link-description">
            Управление категориями товаров: создание, просмотр и удаление категорий
          </p>
        </router-link>

        <router-link to="/admin/products" class="link-card">
          <div class="link-icon">📦</div>
          <h4 class="link-title">Товары</h4>
          <p class="link-description">
            Управление товарами: создание, фильтрация, массовое добавление и удаление
          </p>
        </router-link>

        <router-link to="/admin/reviews" class="link-card">
          <div class="link-icon">⭐</div>
          <h4 class="link-title">Отзывы</h4>
          <p class="link-description">
            Просмотр и модерация отзывов пользователей о товарах
          </p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard'
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* Welcome Card */
.welcome-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
}

.welcome-text {
  margin: 0;
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
}

/* Quick Links Section */
.quick-links {
  margin-top: 32px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.link-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.link-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.link-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.link-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

/* Responsive Design */
@media (max-width: 768px) {
  .welcome-card {
    padding: 24px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-text {
    font-size: 15px;
  }

  .links-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .welcome-card {
    padding: 20px;
  }

  .welcome-title {
    font-size: 22px;
  }

  .link-card {
    padding: 20px;
  }

  .link-icon {
    font-size: 36px;
  }

  .link-title {
    font-size: 18px;
  }
}
</style>
