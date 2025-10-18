/**
 * Utility functions for formatting data in the frontend
 */

/**
 * Format currency values
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: INDIA)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00'
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const FixedOrPercentage = (ispercentage ) => {
  return ispercentage == 'percentage' ? '%' : "₹"
}

/**
 * Format date values
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A'
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return 'Invalid Date'
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Format date and time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    const now = new Date()
    const diffInSeconds = Math.floor((now - dateObj) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return formatDate(date)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Format numbers with thousands separators
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0'
  }
  
  return new Intl.NumberFormat('en-US').format(number)
}

/**
 * Format percentage values
 * @param {number} value - The value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Truncate text to specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get initials from a name
 * @param {string} name - The name to get initials from
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return 'N/A'
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Capitalize first letter of each word
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate a random color based on a string
 * @param {string} str - The string to generate color from
 * @returns {string} Hex color code
 */
export const stringToColor = (str) => {
  if (!str) return '#6B7280'
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 65%, 50%)`
}

/**
 * Check if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false
  
  try {
    const dateObj = new Date(date)
    const today = new Date()
    
    return dateObj.toDateString() === today.toDateString()
  } catch (error) {
    return false
  }
}

/**
 * Check if a date is overdue
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if date is overdue
 */
export const isOverdue = (date) => {
  if (!date) return false
  
  try {
    const dateObj = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day
    
    return dateObj < today
  } catch (error) {
    return false
  }
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone)
}


export const InvoiceNumberGenerator = ({ length = 6, prefix = '' }) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}



// format date like just now, 2 minutes ago, today, yesterday, 2 days ago, etc.
export const formatDateRelative = (date) => {
  if (!date) return 'N/A'
  try {
    const dateObj = new Date(date)
    const now = new Date()
    const diffInSeconds = Math.floor((now - dateObj) / 1000)
    
    // Less than a minute
    if (diffInSeconds < 60) return 'Just now'
    
    // Minutes ago
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    // Hours ago
    const diffInHours = Math.floor(diffInSeconds / 3600)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    // Days
    const diffInDays = Math.floor(diffInSeconds / 86400)
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 30) return `${diffInDays} days ago`
    
    return formatDate(date)
  } catch (error) {
    return 'Invalid Date'
  }
}

// get difference between two dates in days
export const dateDiffInDays = (a, b) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.floor((utc2 - utc1) / _MS_PER_DAY)
}


// formate into , 1k , 2k , 1M, 2M, etc.
const SI_SYMBOL = ["", "k", "M", "B", "T", "P", "E"]

export const formatNumberShort = (number) => {
  // what tier? (determines SI symbol)
  const tier = Math.log10(Math.abs(number)) / 3 | 0
  if(tier === 0) return number

  // get suffix and determine scale
  const suffix = SI_SYMBOL[tier]
  const scale = Math.pow(10, tier * 3)
  // scale the number
  const scaled = number / scale
  // format number and add suffix
  return scaled.toFixed(1) + suffix
}



// permission modules 
export const PERMISSION_MODULES = {
  STOCK: 'stock',
  SALES: 'sales',
  PURCHASES: 'purchases',
  REPORTS: 'reports',
  ORGANIZATION: 'organization',
  SYSTEMUSER: 'systemuser',
  SESSIONS: 'sessions',
  PRICING: 'pricing',
  SETTINGS: 'settings',
  CATEGORY: 'category',
  WAREHOUSE: 'warehouse',
  SUPPLIER: 'supplier',
  CUSTOMER: 'customer',
}
