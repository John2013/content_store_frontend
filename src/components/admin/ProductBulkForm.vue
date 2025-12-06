<template>
  <div class="product-bulk-form">
    <form @submit.prevent="handleSubmit">
      <div class="products-list">
        <div 
          v-for="(product, index) in products" 
          :key="index" 
          class="product-item"
        >
          <div class="product-header">
            <h4>Товар {{ index + 1 }}</h4>
            <button 
              v-if="products.length > 1"
              type="button" 
              class="btn-remove"
              @click="removeProduct(index)"
              title="Удалить товар"
            >
              ✕
            </button>
          </div>

          <div class="form-group">
            <label :for="`title-${index}`" class="form-label">
              Название <span class="required">*</span>
            </label>
            <input
              :id="`title-${index}`"
              v-model="product.title"
              type="text"
              class="form-input"
              :class="{ 'input-error': product.errors.title }"
              placeholder="Введите название товара"
              @input="validateProduct(index)"
            />
            <span v-if="product.errors.title" class="error-message">
              {{ product.errors.title }}
            </span>
          </div>

          <div class="form-group">
            <label :for="`description-${index}`" class="form-label">
              Описание
            </label>
            <textarea
              :id="`description-${index}`"
              v-model="product.description"
              class="form-textarea"
              placeholder="Введите описание товара (необязательно)"
              rows="2"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label :for="`price-${index}`" class="form-label">
                Цена <span class="required">*</span>
              </label>
              <input
                :id="`price-${index}`"
                v-model="product.price"
                type="number"
                step="0.01"
                min="0.01"
                class="form-input"
                :class="{ 'input-error': product.errors.price }"
                placeholder="Цена"
                @input="validateProduct(index)"
              />
              <span v-if="product.errors.price" class="error-message">
                {{ product.errors.price }}
              </span>
            </div>

            <div class="form-group">
              <label :for="`category-${index}`" class="form-label">
                Категория
              </label>
              <select
                :id="`category-${index}`"
                v-model="product.category_id"
                class="form-select"
              >
                <option :value="null">Без категории</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label :for="`content-${index}`" class="form-label">
              Контент <span class="required">*</span>
            </label>
            <textarea
              :id="`content-${index}`"
              v-model="product.content_text"
              class="form-textarea"
              :class="{ 'input-error': product.errors.content_text }"
              placeholder="Введите текстовый контент товара"
              rows="4"
              @input="validateProduct(index)"
            ></textarea>
            <span v-if="product.errors.content_text" class="error-message">
              {{ product.errors.content_text }}
            </span>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="product.is_active"
                type="checkbox"
                class="form-checkbox"
              />
              <span>Активен</span>
            </label>
          </div>
        </div>
      </div>

      <button 
        type="button" 
        class="btn btn-add"
        @click="addProduct"
      >
        + Добавить товар
      </button>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="!isValid">
          Создать товары ({{ products.length }})
        </button>
        <button type="button" class="btn btn-secondary" @click="handleCancel">
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ProductBulkForm',
  props: {
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const createEmptyProduct = () => ({
      title: '',
      description: '',
      price: '',
      content_text: '',
      category_id: null,
      is_active: true,
      errors: {
        title: '',
        price: '',
        content_text: ''
      }
    })

    const products = ref([createEmptyProduct()])

    /**
     * Adds a new product to the form
     * Requirements 7.1: Dynamic addition of product fields
     */
    const addProduct = () => {
      products.value.push(createEmptyProduct())
    }

    /**
     * Removes a product from the form
     * Requirements 7.1: Dynamic removal of product fields
     */
    const removeProduct = (index) => {
      if (products.value.length > 1) {
        products.value.splice(index, 1)
      }
    }

    /**
     * Validates a single product
     * Requirements 7.1: Validation of each product
     */
    const validateProduct = (index) => {
      const product = products.value[index]
      let isValid = true

      // Validate title (1-200 characters)
      const title = product.title.trim()
      if (title.length === 0) {
        product.errors.title = 'Название обязательно'
        isValid = false
      } else if (title.length > 200) {
        product.errors.title = 'Не более 200 символов'
        isValid = false
      } else {
        product.errors.title = ''
      }

      // Validate price (> 0)
      const price = parseFloat(product.price)
      if (!product.price || isNaN(price)) {
        product.errors.price = 'Цена обязательна'
        isValid = false
      } else if (price <= 0) {
        product.errors.price = 'Цена должна быть > 0'
        isValid = false
      } else {
        product.errors.price = ''
      }

      // Validate content (not empty)
      const content = product.content_text.trim()
      if (content.length === 0) {
        product.errors.content_text = 'Контент обязателен'
        isValid = false
      } else {
        product.errors.content_text = ''
      }

      return isValid
    }

    /**
     * Validates all products
     */
    const validateAllProducts = () => {
      let allValid = true
      for (let i = 0; i < products.value.length; i++) {
        if (!validateProduct(i)) {
          allValid = false
        }
      }
      return allValid
    }

    const isValid = computed(() => {
      return products.value.every(product => {
        const title = product.title.trim()
        const price = parseFloat(product.price)
        const content = product.content_text.trim()
        
        return title.length > 0 && 
               title.length <= 200 && 
               !isNaN(price) && 
               price > 0 && 
               content.length > 0
      })
    })

    /**
     * Handles form submission
     * Requirements 7.1: Emit submit with array of products
     */
    const handleSubmit = () => {
      if (validateAllProducts()) {
        const productsData = products.value.map(product => ({
          title: product.title.trim(),
          description: product.description.trim() || undefined,
          price: parseFloat(product.price),
          content_text: product.content_text.trim(),
          category_id: product.category_id || undefined,
          is_active: product.is_active
        }))
        
        emit('submit', productsData)
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return {
      products,
      addProduct,
      removeProduct,
      validateProduct,
      isValid,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.product-bulk-form {
  width: 100%;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 20px;
}

.product-item {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.product-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.btn-remove {
  width: 28px;
  height: 28px;
  padding: 0;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #dc2626;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-error,
.form-textarea.input-error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-select {
  cursor: pointer;
  background-color: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
}

.form-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.error-message {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #ef4444;
}

.btn-add {
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #f1f5f9;
  color: #475569;
  border: 2px dashed #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

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

.btn-secondary:hover {
  background: #cbd5e1;
}
</style>
