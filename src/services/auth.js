/**
 * Authentication utilities for managing user tokens and permissions
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * Get the current authentication token
 * @returns {string|null} The token or null if not found
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Set the authentication token
 * @param {string} token - The token to store
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Remove the authentication token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Get the current user data
 * @returns {Object|null} The user object or null if not found
 */
export function getCurrentUser() {
  try {
    const userData = localStorage.getItem(USER_KEY)
    return userData ? JSON.parse(userData) : null
  } catch (e) {
    console.error('Failed to parse user data:', e)
    return null
  }
}

/**
 * Set the current user data
 * @param {Object} user - The user object to store
 */
export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Remove the current user data
 */
export function removeCurrentUser() {
  localStorage.removeItem(USER_KEY)
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export function isAuthenticated() {
  return !!getToken()
}

/**
 * Check if current user has staff permissions
 * Requirements: 1.1, 1.3, 1.5
 * @returns {boolean} True if user is staff
 */
export function isStaff() {
  const user = getCurrentUser()
  return user && user.is_staff === true
}

/**
 * Clear all authentication data (logout)
 */
export function clearAuth() {
  removeToken()
  removeCurrentUser()
}

/**
 * Check if user can access admin panel
 * Requirements: 1.1, 1.3
 * @returns {boolean} True if user is authenticated and is staff
 */
export function canAccessAdmin() {
  return isAuthenticated() && isStaff()
}
