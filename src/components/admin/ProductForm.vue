<template>
  <div class="product-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title" class="form-label">
          Название <span class="required">*</span>
        </label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          class="form-input"
          :class="{ 'input-error': errors.title }"
          placeholder="Введите название товара"
          @input="validateTitle"
        />
        <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
      </div>

      <div class="form-group">
        <label for="description" class="form-label">
          Описание
        </label>
        <textarea
          id="description"
          v-model="formData.description"
          class="form-textarea"
          placeholder="Введите описание товара (необязательно)"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="price" class="form-label">
          Цена <span class="required">*</span>
        </label>
        <input
          id="price"
          v-model="formData.price"
          type="number"
          step="0.01"
          min="0.01"
          class="form-input"
          :class="{ 'input-error': errors.price }"
          placeholder="Введите цену"
          @input="validatePrice"
        />
        <span v-if="errors.price" class="error-message">{{ errors.price }}</span>
      </div>

      <div class="form-group">
        <label for="content_text" class="form-label">
          Контент <span class="required">*</span>
        </label>
        <textarea
          id="content_text"
          v-model="formData.content_text"
          class="form-textarea"
          :class="{ 'input-error': errors.content_text }"
          placeholder="Введите текстовый контент товара"
          rows="6"
          @input="validateContent"
        ></textarea>
        <span v-if="errors.content_text" class="error-message">{{ errors.content_text }}</span>
      </div>

      <div class="form-group">
        <label for="category_id" class="form-label">
          Категория
        </label>
        <select
          id="category_id"
          v-model="formData.category_id"
          class="form-select"
        >
          <option :value="null">Без категории</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            v-model="formData.is_active"
            type="checkbox"
            class="form-checkbox"
          />
          <span>Активен</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="!isValid">
          Создать товар
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
  name: 'ProductForm',
  props: {
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      title: '',
      description: '',
      price: '',
      content_text: '',
      category_id: null,
      is_active: true
    })

    const errors = ref({
      title: '',
      price: '',
      content_text: ''
    })

    /**
     * Validates product title
     * Requirements 6.4: Title must be 1-200 characters
     */
    const validateTitle = () => {
      const title = formData.value.title.trim()
      
      if (title.length === 0) {
        errors.value.title = 'Название обязательно для заполнения'
        return false
      }
      
      if (title.length > 200) {
        errors.value.title = 'Название не должно превышать 200 символов'
        return false
      }
      
      errors.value.title = ''
      return true
    }

    /**
     * Validates product price
     * Requirements 6.4, 6.5: Price must be > 0
     */
    const validatePrice = () => {
      const price = parseFloat(formData.value.price)
      
      if (!formData.value.price || isNaN(price)) {
        errors.value.price = 'Цена обязательна для заполнения'
        return false
      }
      
      if (price <= 0) {
        errors.value.price = 'Цена должна быть больше нуля'
        return false
      }
      
      errors.value.price = ''
      return true
    }

    /**
     * Validates product content
     * Requirements 6.4: Content must not be empty
     */
    const validateContent = () => {
      const content = formData.value.content_text.trim()
      
      if (content.length === 0) {
        errors.value.content_text = 'Контент обязателен для заполнения'
        return false
      }
      
      errors.value.content_text = ''
      return true
    }

    const isValid = computed(() => {
      const title = formData.value.title.trim()
      const price = parseFloat(formData.value.price)
      const content = formData.value.content_text.trim()
      
      return title.length > 0 && 
             title.length <= 200 && 
             !isNaN(price) && 
             price > 0 && 
             content.length > 0
    })

    /**
     * Handles form submission
     * Requirements 6.1: Emit submit with form data
     */
    const handleSubmit = () => {
      const titleValid = validateTitle()
      const priceValid = validatePrice()
      const contentValid = validateContent()
      
      if (titleValid && priceValid && contentValid) {
        emit('submit', {
          title: formData.value.title.trim(),
          description: formData.value.description.trim() || undefined,
          price: parseFloat(formData.value.price),
          content_text: formData.value.content_text.trim(),
          category_id: formData.value.category_id || undefined,
          is_active: formData.value.is_active
        })
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return {
      formData,
      errors,
      isValid,
      validateTitle,
      validatePrice,
      validateContent,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.product-form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
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
  padding: 10px 12px;
  font-size: 14px;
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
  min-height: 80px;
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
  font-size: 14px;
  color: #1e293b;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: #ef4444;
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
