<template>
  <div class="category-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name" class="form-label">
          Название <span class="required">*</span>
        </label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          class="form-input"
          :class="{ 'input-error': errors.name }"
          placeholder="Введите название категории"
          @input="validateName"
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label for="description" class="form-label">
          Описание
        </label>
        <textarea
          id="description"
          v-model="formData.description"
          class="form-textarea"
          placeholder="Введите описание категории (необязательно)"
          rows="4"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="!isValid">
          {{ isEdit ? 'Сохранить изменения' : 'Создать категорию' }}
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
  name: 'CategoryForm',
  props: {
    initialData: {
      type: Object,
      default: null
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      name: props.initialData?.name || '',
      description: props.initialData?.description || ''
    })

    const errors = ref({
      name: ''
    })

    /**
     * Validates category name
     * Requirements 3.4: Name must be 1-100 characters
     */
    const validateName = () => {
      const name = formData.value.name.trim()
      
      if (name.length === 0) {
        errors.value.name = 'Название обязательно для заполнения'
        return false
      }
      
      if (name.length > 100) {
        errors.value.name = 'Название не должно превышать 100 символов'
        return false
      }
      
      errors.value.name = ''
      return true
    }

    const isValid = computed(() => {
      const name = formData.value.name.trim()
      return name.length > 0 && name.length <= 100
    })

    /**
     * Handles form submission
     * Requirements 3.1: Emit submit with form data
     */
    const handleSubmit = () => {
      if (validateName()) {
        emit('submit', {
          name: formData.value.name.trim(),
          description: formData.value.description.trim() || undefined
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
      validateName,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.category-form {
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
.form-textarea {
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
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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
