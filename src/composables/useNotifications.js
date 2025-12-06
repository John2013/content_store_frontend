/**
 * Composable for managing notifications
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { ref } from 'vue'

// Shared reactive state for notifications
const notifications = ref([])
let notificationIdCounter = 0

/**
 * Composable for managing application notifications
 * @returns {Object} Notification management methods and state
 */
export function useNotifications() {
  /**
   * Add a new notification
   * Requirements: 12.1, 12.2
   * @param {string} message - The notification message
   * @param {string} type - The notification type ('success', 'error', 'info')
   * @param {number} duration - Auto-close duration in milliseconds (default: 3000)
   * @returns {number} The notification ID
   */
  function addNotification(message, type = 'info', duration = 3000) {
    const id = ++notificationIdCounter
    const notification = {
      id,
      message,
      type,
      duration
    }
    
    notifications.value.push(notification)
    
    // Auto-close after duration
    // Requirement 12.1: Success notifications auto-close after 3 seconds
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  /**
   * Add a success notification
   * Requirement 12.1: Display success notifications
   * @param {string} message - The success message
   * @param {number} duration - Auto-close duration (default: 3000ms)
   * @returns {number} The notification ID
   */
  function success(message, duration = 3000) {
    return addNotification(message, 'success', duration)
  }

  /**
   * Add an error notification
   * Requirement 12.2: Display error notifications with description
   * @param {string} message - The error message
   * @param {number} duration - Auto-close duration (default: 5000ms for errors)
   * @returns {number} The notification ID
   */
  function error(message, duration = 5000) {
    return addNotification(message, 'error', duration)
  }

  /**
   * Add an info notification
   * @param {string} message - The info message
   * @param {number} duration - Auto-close duration (default: 3000ms)
   * @returns {number} The notification ID
   */
  function info(message, duration = 3000) {
    return addNotification(message, 'info', duration)
  }

  /**
   * Remove a notification by ID
   * Requirement 12.4: Allow dismissal of notifications
   * @param {number} id - The notification ID to remove
   */
  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll() {
    notifications.value = []
  }

  return {
    notifications,
    addNotification,
    success,
    error,
    info,
    removeNotification,
    clearAll
  }
}
