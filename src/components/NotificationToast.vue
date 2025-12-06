<!--
  NotificationToast Component
  Requirements: 12.1, 12.2, 12.4
  
  Displays notification messages with different types (success/error/info)
  Auto-closes after specified duration
  Can be dismissed by clicking
-->

<template>
  <transition name="toast-fade">
    <div 
      v-if="visible"
      :class="['notification-toast', `toast-${type}`]"
      @click="handleClick"
      role="alert"
      :aria-live="type === 'error' ? 'assertive' : 'polite'"
    >
      <div class="toast-icon">
        <span v-if="type === 'success'">✓</span>
        <span v-else-if="type === 'error'">✕</span>
        <span v-else>ℹ</span>
      </div>
      <div class="toast-message">{{ message }}</div>
      <button 
        class="toast-close" 
        @click.stop="close"
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  </transition>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'NotificationToast',
  props: {
    /**
     * The notification message to display
     */
    message: {
      type: String,
      required: true
    },
    /**
     * The type of notification (success, error, info)
     * Requirement 12.1: Success notifications
     * Requirement 12.2: Error notifications
     */
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'info'].includes(value)
    },
    /**
     * Auto-close duration in milliseconds
     * Requirement 12.1: Auto-close after 3 seconds for success
     * Set to 0 to disable auto-close
     */
    duration: {
      type: Number,
      default: 3000
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const visible = ref(true)
    let autoCloseTimer = null

    /**
     * Close the notification
     * Requirement 12.4: Allow dismissal by clicking
     */
    const close = () => {
      visible.value = false
      // Wait for animation to complete before emitting close
      setTimeout(() => {
        emit('close')
      }, 300)
    }

    /**
     * Handle click on notification body
     * Requirement 12.4: Close notification on click
     */
    const handleClick = () => {
      close()
    }

    /**
     * Set up auto-close timer
     * Requirement 12.1: Auto-close after specified duration
     */
    onMounted(() => {
      if (props.duration > 0) {
        autoCloseTimer = setTimeout(() => {
          close()
        }, props.duration)
      }
    })

    /**
     * Clean up timer on unmount
     */
    onUnmounted(() => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer)
      }
    })

    return {
      visible,
      close,
      handleClick
    }
  }
}
</script>

<style scoped>
.notification-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 500px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

.notification-toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  font-size: 16px;
}

.toast-success .toast-icon {
  background: #10b981;
  color: white;
}

.toast-error .toast-icon {
  background: #ef4444;
  color: white;
}

.toast-info .toast-icon {
  background: #3b82f6;
  color: white;
}

.toast-message {
  flex: 1;
  color: #222;
  font-size: 14px;
  line-height: 1.5;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #666;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 0;
}

.toast-close:hover {
  background: #f3f4f6;
  color: #222;
}

.toast-close:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Toast type specific styles */
.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

/* Fade animation */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
