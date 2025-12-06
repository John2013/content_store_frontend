<!--
  ConfirmDialog Component
  Requirements: 4.1, 8.1, 10.1
  
  Displays a confirmation dialog with customizable text
  Emits confirm and cancel events
-->

<template>
  <transition name="dialog-fade">
    <div 
      v-if="visible"
      class="dialog-overlay"
      @click="handleOverlayClick"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="messageId"
    >
      <div class="dialog-container" @click.stop>
        <div class="dialog-header">
          <h3 :id="titleId" class="dialog-title">{{ title }}</h3>
          <button 
            class="dialog-close-btn"
            @click="handleCancel"
            aria-label="Закрыть диалог"
          >
            ×
          </button>
        </div>
        
        <div class="dialog-body">
          <p :id="messageId" class="dialog-message">{{ message }}</p>
        </div>
        
        <div class="dialog-footer">
          <button 
            class="dialog-btn dialog-btn-cancel"
            @click="handleCancel"
            type="button"
          >
            {{ cancelText }}
          </button>
          <button 
            class="dialog-btn dialog-btn-confirm"
            @click="handleConfirm"
            type="button"
            ref="confirmButton"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export default {
  name: 'ConfirmDialog',
  props: {
    /**
     * Dialog title
     * Requirement 4.1: Customizable text
     */
    title: {
      type: String,
      required: true
    },
    /**
     * Dialog message/description
     * Requirement 4.1: Customizable text
     */
    message: {
      type: String,
      required: true
    },
    /**
     * Text for confirm button
     * Requirement 4.1: Customizable text
     */
    confirmText: {
      type: String,
      default: 'Подтвердить'
    },
    /**
     * Text for cancel button
     * Requirement 4.1: Customizable text
     */
    cancelText: {
      type: String,
      default: 'Отмена'
    },
    /**
     * Controls dialog visibility
     */
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm', 'cancel', 'update:modelValue'],
  setup(props, { emit }) {
    const visible = ref(props.modelValue)
    const confirmButton = ref(null)
    const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`
    const messageId = `dialog-message-${Math.random().toString(36).substr(2, 9)}`

    /**
     * Handle confirm action
     * Requirement 4.1: Emit confirm event
     */
    const handleConfirm = () => {
      emit('confirm')
      emit('update:modelValue', false)
      visible.value = false
    }

    /**
     * Handle cancel action
     * Requirement 4.1: Emit cancel event
     */
    const handleCancel = () => {
      emit('cancel')
      emit('update:modelValue', false)
      visible.value = false
    }

    /**
     * Handle overlay click (clicking outside dialog)
     */
    const handleOverlayClick = () => {
      handleCancel()
    }

    /**
     * Handle escape key press
     */
    const handleEscape = (event) => {
      if (event.key === 'Escape' && visible.value) {
        handleCancel()
      }
    }

    /**
     * Focus confirm button when dialog opens
     */
    onMounted(() => {
      document.addEventListener('keydown', handleEscape)
      if (props.modelValue) {
        nextTick(() => {
          confirmButton.value?.focus()
        })
      }
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleEscape)
    })

    return {
      visible,
      confirmButton,
      titleId,
      messageId,
      handleConfirm,
      handleCancel,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.dialog-overlay {
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
  padding: 16px;
}

.dialog-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.dialog-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  padding: 0;
}

.dialog-close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.dialog-close-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.dialog-body {
  padding: 24px;
}

.dialog-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #4b5563;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dialog-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  min-width: 100px;
}

.dialog-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.dialog-btn-cancel {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.dialog-btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.dialog-btn-confirm {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.dialog-btn-confirm:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.dialog-btn-confirm:active {
  background: #b91c1c;
  border-color: #b91c1c;
}

/* Dialog fade animation */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-active .dialog-container,
.dialog-fade-leave-active .dialog-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .dialog-container {
  transform: scale(0.95);
  opacity: 0;
}

.dialog-fade-leave-to .dialog-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
