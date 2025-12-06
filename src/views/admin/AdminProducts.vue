<template>
  <div class="admin-products">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Управление товарами</h1>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="openBulkModal">
          + Массовое создание
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          + Создать товар
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label for="category-filter" class="filter-label">Категория:</label>
        <select
          id="category-filter"
          v-model="selectedCategory"
          class="filter-select"
          @change="handleCategoryFilter"
        >
          <option :value="null">Все категории</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка товаров...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && products.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3 class="empty-title">Товары отсутствуют</h3>
      <p class="empty-text">
        {{ selectedCategory ? 'В этой категории нет товаров' : 'Создайте первый товар для продажи' }}
      </p>
      <button class="btn btn-primary" @click="openCreateModal">
        Создать товар
      </button>
    </div>

    <!-- Products List -->
    <div v-else class="products-container">
      <div class="products-list">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
        >
          <div class="product-content">
            <div class="product-header-row">
              <h3 class="product-title">{{ product.title }}</h3>
              <span class="product-status" :class="{ active: product.is_active }">
                {{ product.is_active ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
            
            <p v-if="product.description" class="product-description">
              {{ product.description }}
            </p>
            <p v-else class="product-description empty">
              Описание отсутствует
            </p>
            
            <div class="product-meta">
              <div class="meta-item">
                <span class="meta-label">Цена:</span>
                <span class="meta-value price">{{ product.price }} ₽</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Категория:</span>
                <span class="meta-value">
                  {{ product.category ? product.category.name : 'Без категории' }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Создано:</span>
                <span class="meta-value">{{ formatDate(product.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <button
              class="btn btn-danger btn-sm"
              @click="confirmDelete(product)"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button
          class="btn btn-secondary btn-sm"
          :disabled="pagination.skip === 0"
          @click="previousPage"
        >
          ← Назад
        </button>
        <span class="pagination-info">
          Показано {{ products.length }} товаров (начиная с {{ pagination.skip + 1 }})
        </span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="products.length < pagination.limit"
          @click="nextPage"
        >
          Вперёд →
        </button>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Создать товар</h2>
          <button class="modal-close" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <ProductForm
            :categories="categories"
            @submit="handleCreateProduct"
            @cancel="closeCreateModal"
          />
        </div>
      </div>
    </div>

    <!-- Bulk Create Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click="closeBulkModal">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Массовое создание товаров</h2>
          <button class="modal-close" @click="closeBulkModal">×</button>
        </div>
        <div class="modal-body">
          <ProductBulkForm
            :categories="categories"
            @submit="handleBulkCreateProducts"
            @cancel="closeBulkModal"
          />
        </div>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="Удалить товар?"
      :message="`Вы уверены, что хотите удалить товар '${productToDelete?.title}'? Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="handleDeleteProduct"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../../services/api.js'
import ProductForm from '../../components/admin/ProductForm.vue'
import ProductBulkForm from '../../components/admin/ProductBulkForm.vue'
import ConfirmDialog from '../../components/admin/ConfirmDialog.vue'
import { useNotifications } from '../../composables/useNotifications.js'

export default {
  name: 'AdminProducts',
  components: {
    ProductForm,
    ProductBulkForm,
    ConfirmDialog
  },
  setup() {
    const { addNotification } = useNotifications()
    const products = ref([])
    const categories = ref([])
    const loading = ref(false)
    const showCreateModal = ref(false)
    const showBulkModal = ref(false)
    const showDeleteDialog = ref(false)
    const productToDelete = ref(null)
    const selectedCategory = ref(null)
    const pagination = ref({
      skip: 0,
      limit: 20
    })

    /**
     * Loads categories for filter
     * Requirements 5.3: Load categories for filtering
     */
    const loadCategories = async () => {
      try {
        const data = await api.getCategories()
        categories.value = data
      } catch (error) {
        addNotification({
          message: 'Ошибка при загрузке категорий: ' + error.message,
          type: 'error'
        })
      }
    }

    /**
     * Loads products from API
     * Requirements 5.1: Load and display all products
     * Requirements 5.3: Filter by category
     * Requirements 5.4: Pagination with skip/limit
     */
    const loadProducts = async () => {
      loading.value = true
      try {
        const data = await api.getProducts(
          selectedCategory.value,
          pagination.value.skip,
          pagination.value.limit
        )
        products.value = data
      } catch (error) {
        // Requirement 5.5: Display error message on load failure
        addNotification({
          message: 'Ошибка при загрузке товаров: ' + error.message,
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    /**
     * Handles category filter change
     * Requirements 5.3: Filter products by category
     */
    const handleCategoryFilter = () => {
      pagination.value.skip = 0
      loadProducts()
    }

    /**
     * Pagination controls
     * Requirements 5.4: Implement pagination
     */
    const nextPage = () => {
      pagination.value.skip += pagination.value.limit
      loadProducts()
    }

    const previousPage = () => {
      pagination.value.skip = Math.max(0, pagination.value.skip - pagination.value.limit)
      loadProducts()
    }

    /**
     * Opens create product modal
     * Requirements 6.1: Display form for creating product
     */
    const openCreateModal = () => {
      showCreateModal.value = true
    }

    const closeCreateModal = () => {
      showCreateModal.value = false
    }

    /**
     * Opens bulk create modal
     * Requirements 7.1: Display form for bulk creation
     */
    const openBulkModal = () => {
      showBulkModal.value = true
    }

    const closeBulkModal = () => {
      showBulkModal.value = false
    }

    /**
     * Handles product creation
     * Requirements 6.2: Call API to create product
     * Requirements 6.3: Update list and show success notification
     * Requirements 6.6: Handle errors with notifications
     */
    const handleCreateProduct = async (data) => {
      try {
        await api.createProduct(data)
        
        // Reload products to show the new one
        await loadProducts()
        
        // Close modal
        closeCreateModal()
        
        // Show success notification
        addNotification({
          message: 'Товар успешно создан',
          type: 'success'
        })
      } catch (error) {
        // Requirement 6.6: Display error message
        addNotification({
          message: 'Ошибка при создании товара: ' + error.message,
          type: 'error'
        })
      }
    }

    /**
     * Handles bulk product creation
     * Requirements 7.2: Call API to create multiple products
     * Requirements 7.3: Update list and show count of created products
     * Requirements 7.4: Handle errors with notifications
     */
    const handleBulkCreateProducts = async (productsData) => {
      try {
        const result = await api.createProductsBulk(productsData)
        
        // Reload products to show the new ones
        await loadProducts()
        
        // Close modal
        closeBulkModal()
        
        // Show success notification with count
        const count = Array.isArray(result) ? result.length : productsData.length
        addNotification({
          message: `Успешно создано товаров: ${count}`,
          type: 'success'
        })
      } catch (error) {
        // Requirement 7.4: Display error message
        addNotification({
          message: 'Ошибка при массовом создании товаров: ' + error.message,
          type: 'error'
        })
      }
    }

    /**
     * Opens delete confirmation dialog
     * Requirements 8.1: Display confirmation dialog
     */
    const confirmDelete = (product) => {
      productToDelete.value = product
      showDeleteDialog.value = true
    }

    const closeDeleteDialog = () => {
      showDeleteDialog.value = false
      productToDelete.value = null
    }

    /**
     * Handles product deletion
     * Requirements 8.2: Call API to delete product
     * Requirements 8.3: Update list and show success notification
     * Requirements 8.4: Handle errors with notifications
     */
    const handleDeleteProduct = async () => {
      if (!productToDelete.value) return

      try {
        await api.deleteProduct(productToDelete.value.id)
        
        // Reload products to reflect deletion
        await loadProducts()
        
        // Close dialog
        closeDeleteDialog()
        
        // Show success notification
        addNotification({
          message: 'Товар успешно удален',
          type: 'success'
        })
      } catch (error) {
        // Requirement 8.4: Display error message
        addNotification({
          message: 'Ошибка при удалении товара: ' + error.message,
          type: 'error'
        })
        closeDeleteDialog()
      }
    }

    /**
     * Formats date for display
     * Requirements 5.2: Display creation date
     */
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    // Load data on mount
    onMounted(() => {
      loadCategories()
      loadProducts()
    })

    return {
      products,
      categories,
      loading,
      showCreateModal,
      showBulkModal,
      showDeleteDialog,
      productToDelete,
      selectedCategory,
      pagination,
      loadProducts,
      handleCategoryFilter,
      nextPage,
      previousPage,
      openCreateModal,
      closeCreateModal,
      openBulkModal,
      closeBulkModal,
      handleCreateProduct,
      handleBulkCreateProducts,
      confirmDelete,
      closeDeleteDialog,
      handleDeleteProduct,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-products {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Filters */
.filters-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.filter-select {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  min-width: 200px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 16px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.empty-text {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 15px;
}

/* Products Container */
.products-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Products List */
.products-list {
  display: grid;
  gap: 16px;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-content {
  flex: 1;
}

.product-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.product-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.product-status {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
}

.product-status.active {
  background: #dcfce7;
  color: #16a34a;
}

.product-description {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #475569;
  line-height: 1.5;
}

.product-description.empty {
  color: #94a3b8;
  font-style: italic;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.meta-item {
  display: flex;
  gap: 4px;
}

.meta-label {
  font-weight: 500;
  color: #64748b;
}

.meta-value {
  color: #475569;
}

.meta-value.price {
  font-weight: 600;
  color: #3b82f6;
}

.product-actions {
  margin-left: 16px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e1;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .header-actions .btn {
    width: 100%;
  }

  .page-title {
    font-size: 24px;
  }

  .filters-bar {
    padding: 12px 16px;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-select {
    width: 100%;
  }

  .product-card {
    flex-direction: column;
  }

  .product-actions {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }

  .product-actions .btn {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-info {
    order: -1;
  }
}

@media (max-width: 640px) {
  .admin-products {
    padding: 0 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .product-card {
    padding: 20px;
  }

  .modal-content {
    max-width: 100%;
  }
}
</style>
