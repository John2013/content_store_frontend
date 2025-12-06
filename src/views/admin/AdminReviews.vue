<template>
  <div class="admin-reviews">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">Управление отзывами</h1>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка отзывов...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && reviews.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h3 class="empty-title">Отзывы отсутствуют</h3>
      <p class="empty-text">
        Пока нет отзывов от пользователей
      </p>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-container">
      <div class="reviews-list">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="review-card"
        >
          <div class="review-content">
            <div class="review-header">
              <div class="review-user-info">
                <span class="user-name">
                  {{ review.user ? review.user.email : 'Неизвестный пользователь' }}
                </span>
                <div class="review-rating">
                  <span v-for="star in 5" :key="star" class="star" :class="{ filled: star <= review.rating }">
                    ★
                  </span>
                  <span class="rating-value">{{ review.rating }}/5</span>
                </div>
              </div>
              <span class="review-date">{{ formatDate(review.created_at) }}</span>
            </div>

            <div class="review-product">
              <span class="product-label">Товар:</span>
              <span class="product-name">
                {{ review.product ? review.product.title : `ID: ${review.product_id}` }}
              </span>
            </div>

            <p v-if="review.comment" class="review-comment">
              {{ review.comment }}
            </p>
            <p v-else class="review-comment empty">
              Комментарий отсутствует
            </p>
          </div>

          <div class="review-actions">
            <button
              class="btn btn-danger btn-sm"
              @click="confirmDelete(review)"
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
          Показано {{ reviews.length }} отзывов (начиная с {{ pagination.skip + 1 }})
        </span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="reviews.length < pagination.limit"
          @click="nextPage"
        >
          Вперёд →
        </button>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="Удалить отзыв?"
      :message="`Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="handleDeleteReview"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../../services/api.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.vue'
import { useNotifications } from '../../composables/useNotifications.js'

export default {
  name: 'AdminReviews',
  components: {
    ConfirmDialog
  },
  setup() {
    const { addNotification } = useNotifications()
    const reviews = ref([])
    const loading = ref(false)
    const showDeleteDialog = ref(false)
    const reviewToDelete = ref(null)
    const pagination = ref({
      skip: 0,
      limit: 20
    })

    /**
     * Loads reviews from API
     * Requirements 9.1: Load and display all reviews
     * Requirements 9.3: Pagination with skip/limit
     */
    const loadReviews = async () => {
      loading.value = true
      try {
        const data = await api.getAllReviews(
          pagination.value.skip,
          pagination.value.limit
        )
        reviews.value = data
      } catch (error) {
        // Requirement 9.4: Display error message on load failure
        addNotification({
          message: 'Ошибка при загрузке отзывов: ' + error.message,
          type: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    /**
     * Pagination controls
     * Requirements 9.3: Implement pagination
     */
    const nextPage = () => {
      pagination.value.skip += pagination.value.limit
      loadReviews()
    }

    const previousPage = () => {
      pagination.value.skip = Math.max(0, pagination.value.skip - pagination.value.limit)
      loadReviews()
    }

    /**
     * Opens delete confirmation dialog
     * Requirements 10.1: Display confirmation dialog
     */
    const confirmDelete = (review) => {
      reviewToDelete.value = review
      showDeleteDialog.value = true
    }

    const closeDeleteDialog = () => {
      showDeleteDialog.value = false
      reviewToDelete.value = null
    }

    /**
     * Handles review deletion
     * Requirements 10.2: Call API to delete review
     * Requirements 10.3: Update list and show success notification
     * Requirements 10.4: Handle errors with notifications
     */
    const handleDeleteReview = async () => {
      if (!reviewToDelete.value) return

      try {
        await api.deleteReview(reviewToDelete.value.id)
        
        // Reload reviews to reflect deletion
        await loadReviews()
        
        // Close dialog
        closeDeleteDialog()
        
        // Show success notification
        addNotification({
          message: 'Отзыв успешно удален',
          type: 'success'
        })
      } catch (error) {
        // Requirement 10.4: Display error message
        addNotification({
          message: 'Ошибка при удалении отзыва: ' + error.message,
          type: 'error'
        })
        closeDeleteDialog()
      }
    }

    /**
     * Formats date for display
     * Requirements 9.2: Display creation date
     */
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Load reviews on mount
    onMounted(() => {
      loadReviews()
    })

    return {
      reviews,
      loading,
      showDeleteDialog,
      reviewToDelete,
      pagination,
      loadReviews,
      nextPage,
      previousPage,
      confirmDelete,
      closeDeleteDialog,
      handleDeleteReview,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-reviews {
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

/* Reviews Container */
.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Reviews List */
.reviews-list {
  display: grid;
  gap: 16px;
}

.review-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: box-shadow 0.2s;
}

.review-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.review-content {
  flex: 1;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 16px;
}

.review-user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star {
  color: #cbd5e1;
  font-size: 18px;
}

.star.filled {
  color: #fbbf24;
}

.rating-value {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.review-date {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}

.review-product {
  margin-bottom: 12px;
  font-size: 14px;
}

.product-label {
  font-weight: 500;
  color: #64748b;
}

.product-name {
  margin-left: 6px;
  color: #475569;
}

.review-comment {
  margin: 0;
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
}

.review-comment.empty {
  color: #94a3b8;
  font-style: italic;
}

.review-actions {
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

  .review-card {
    flex-direction: column;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-actions {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }

  .review-actions .btn {
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
  .admin-reviews {
    padding: 0 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .review-card {
    padding: 20px;
  }
}
</style>
