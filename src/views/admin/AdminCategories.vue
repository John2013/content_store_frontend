<template>
  <div class="admin-categories">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Управление категориями</h1>
      <button class="btn btn-primary" @click="openCreateModal">
        + Создать категорию
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка категорий...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && categories.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <h3 class="empty-title">Категории отсутствуют</h3>
      <p class="empty-text">
        Создайте первую категорию для организации товаров
      </p>
      <button class="btn btn-primary" @click="openCreateModal">
        Создать категорию
      </button>
    </div>

    <!-- Categories List -->
    <div v-else class="categories-list">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-card"
      >
        <div class="category-content">
          <h3 class="category-name">{{ category.name }}</h3>
          <p v-if="category.description" class="category-description">
            {{ category.description }}
          </p>
          <p v-else class="category-description empty">
            Описание отсутствует
          </p>
          <div class="category-meta">
            <span class="meta-label">Создано:</span>
            <span class="meta-value">{{ formatDate(category.created_at) }}</span>
          </div>
        </div>
        <div class="category-actions">
          <button
            class="btn btn-danger btn-sm"
            @click="confirmDelete(category)"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Создать категорию</h2>
          <button class="modal-close" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <CategoryForm @submit="handleCreateCategory" @cancel="closeCreateModal" />
        </div>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="Удалить категорию?"
      :message="`Вы уверены, что хотите удалить категорию '${categoryToDelete?.name}'? Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="handleDeleteCategory"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../../services/api.js'
import CategoryForm from '../../components/admin/CategoryForm.vue'
import ConfirmDialog from '../../components/admin/ConfirmDialog.vue'
import { useNotifications } from '../../composables/useNotifications.js'

export default {
  name: 'AdminCategories',
  components: {
    CategoryForm,
    ConfirmDialog
  },
  setup() {
    const { addNotification } = useNotifications()
    const categories = ref([])
    const loading = ref(false)
    const showCreateModal = ref(false)
    const showDeleteDialog = ref(false)
    const categoryToDelete = ref(null)

    /**
     * Loads categories from API
     * Requirements 2.1: Load and display all categories
     */
    const loadCategories = async () => {
      loading.value = true
      try {
        const data = await api.getCategories()
        categories.value = data
      } catch (error) {
        // Requirement 2.4: Display error message on load failure
        addNotification({
          message: 'Ошибка при загрузке категорий: ' + error.message,
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    /**
     * Opens create category modal
     * Requirements 3.1: Display form for creating category
     */
    const openCreateModal = () => {
      showCreateModal.value = true
    }

    const closeCreateModal = () => {
      showCreateModal.value = false
    }

    /**
     * Handles category creation
     * Requirements 3.2: Call API to create category
     * Requirements 3.3: Update list and show success notification
     * Requirements 3.5: Handle errors with notifications
     */
    const handleCreateCategory = async (data) => {
      try {
        await api.createCategory(data)
        
        // Reload categories to show the new one
        await loadCategories()
        
        // Close modal
        closeCreateModal()
        
        // Show success notification
        addNotification({
          message: 'Категория успешно создана',
          type: 'success'
        })
      } catch (error) {
        // Requirement 3.5: Display error message
        addNotification({
          message: 'Ошибка при создании категории: ' + error.message,
          type: 'error'
        })
      }
    }

    /**
     * Opens delete confirmation dialog
     * Requirements 4.1: Display confirmation dialog
     */
    const confirmDelete = (category) => {
      categoryToDelete.value = category
      showDeleteDialog.value = true
    }

    const closeDeleteDialog = () => {
      showDeleteDialog.value = false
      categoryToDelete.value = null
    }

    /**
     * Handles category deletion
     * Requirements 4.2: Call API to delete category
     * Requirements 4.3: Update list and show success notification
     * Requirements 4.4: Handle errors with notifications
     */
    const handleDeleteCategory = async () => {
      if (!categoryToDelete.value) return

      try {
        await api.deleteCategory(categoryToDelete.value.id)
        
        // Reload categories to reflect deletion
        await loadCategories()
        
        // Close dialog
        closeDeleteDialog()
        
        // Show success notification
        addNotification({
          message: 'Категория успешно удалена',
          type: 'success'
        })
      } catch (error) {
        // Requirement 4.4: Display error message
        addNotification({
          message: 'Ошибка при удалении категории: ' + error.message,
          type: 'error'
        })
        closeDeleteDialog()
      }
    }

    /**
     * Formats date for display
     * Requirements 2.2: Display creation date
     */
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Load categories on mount
    onMounted(() => {
      loadCategories()
    })

    return {
      categories,
      loading,
      showCreateModal,
      showDeleteDialog,
      categoryToDelete,
      loadCategories,
      openCreateModal,
      closeCreateModal,
      handleCreateCategory,
      confirmDelete,
      closeDeleteDialog,
      handleDeleteCategory,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-categories {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
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

/* Categories List */
.categories-list {
  display: grid;
  gap: 16px;
}

.category-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: box-shadow 0.2s;
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-content {
  flex: 1;
}

.category-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.category-description {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #475569;
  line-height: 1.5;
}

.category-description.empty {
  color: #94a3b8;
  font-style: italic;
}

.category-meta {
  font-size: 13px;
  color: #64748b;
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  margin-left: 4px;
}

.category-actions {
  margin-left: 16px;
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

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

  .page-title {
    font-size: 24px;
  }

  .category-card {
    flex-direction: column;
  }

  .category-actions {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }

  .category-actions .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .admin-categories {
    padding: 0 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .category-card {
    padding: 20px;
  }

  .modal-content {
    max-width: 100%;
  }
}
</style>
