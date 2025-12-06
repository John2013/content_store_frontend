/**
 * Property-based tests for useNotifications composable
 * Feature: admin-panel
 * Validates: Requirements 12.1, 12.2, 12.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useNotifications } from './useNotifications.js'
import * as fc from 'fast-check'

describe('useNotifications - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear all notifications before each test
    const { clearAll } = useNotifications()
    clearAll()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  /**
   * Feature: admin-panel, Property 23: Success notification display
   * Validates: Requirements 12.1
   * 
   * For any success message, the notification should be added to the list
   * and automatically close after 3 seconds
   */
  it('Property 23: Success notification display - for any success message, notification is added and auto-closes after 3 seconds', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }), // Generate random non-empty messages
        (message) => {
          const { notifications, success, clearAll } = useNotifications()
          
          // Clear before test
          clearAll()
          
          // Add success notification
          const id = success(message)
          
          // Verify notification was added
          expect(notifications.value.length).toBe(1)
          expect(notifications.value[0].message).toBe(message)
          expect(notifications.value[0].type).toBe('success')
          expect(notifications.value[0].id).toBe(id)
          
          // Verify it auto-closes after 3 seconds
          vi.advanceTimersByTime(3000)
          expect(notifications.value.length).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 24: Error notification display
   * Validates: Requirements 12.2
   * 
   * For any error message, the notification should be added to the list
   * with type 'error' and include the error description
   */
  it('Property 24: Error notification display - for any error message, notification is added with error type and description', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }), // Generate random error messages
        (errorMessage) => {
          const { notifications, error, clearAll } = useNotifications()
          
          // Clear before test
          clearAll()
          
          // Add error notification
          const id = error(errorMessage)
          
          // Verify notification was added with correct properties
          expect(notifications.value.length).toBe(1)
          expect(notifications.value[0].message).toBe(errorMessage)
          expect(notifications.value[0].type).toBe('error')
          expect(notifications.value[0].id).toBe(id)
          
          // Verify the error message (description) is preserved
          expect(notifications.value[0].message).toContain(errorMessage)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: admin-panel, Property 26: Notification dismissal
   * Validates: Requirements 12.4
   * 
   * For any notification, clicking/dismissing it should immediately remove it
   * from the notification list
   */
  it('Property 26: Notification dismissal - for any notification, dismissal removes it immediately', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }), // Message
        fc.constantFrom('success', 'error', 'info'), // Type
        (message, type) => {
          const { notifications, addNotification, removeNotification, clearAll } = useNotifications()
          
          // Clear before test
          clearAll()
          
          // Add notification
          const id = addNotification(message, type, 5000)
          
          // Verify notification exists
          expect(notifications.value.length).toBe(1)
          expect(notifications.value[0].id).toBe(id)
          
          // Dismiss the notification
          removeNotification(id)
          
          // Verify notification was removed immediately
          expect(notifications.value.length).toBe(0)
          expect(notifications.value.find(n => n.id === id)).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Additional property test: Multiple notifications handling
   * Validates: Requirements 12.3
   * 
   * For any sequence of notifications, all should be visible simultaneously
   */
  it('Property: Multiple notifications - for any sequence of notifications, all are visible simultaneously', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 200 }),
            type: fc.constantFrom('success', 'error', 'info')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (notificationData) => {
          const { notifications, addNotification, clearAll } = useNotifications()
          
          // Clear before test
          clearAll()
          
          // Add all notifications
          const ids = notificationData.map(data => 
            addNotification(data.message, data.type, 10000)
          )
          
          // Verify all notifications are present
          expect(notifications.value.length).toBe(notificationData.length)
          
          // Verify each notification has correct data
          ids.forEach((id, index) => {
            const notification = notifications.value.find(n => n.id === id)
            expect(notification).toBeDefined()
            expect(notification.message).toBe(notificationData[index].message)
            expect(notification.type).toBe(notificationData[index].type)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
