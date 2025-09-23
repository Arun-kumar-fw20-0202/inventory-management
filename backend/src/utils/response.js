/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const success = (res, message = 'Success', data = null, statusCode = 200) => {
   return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
   });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {any} error - Error details
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const error = (res, message = 'Internal Server Error', error = null, statusCode = 500) => {
   const errorResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString()
   };

   // Include error details only in development
   if (process.env.NODE_ENV === 'development' && error) {
      errorResponse.error = {
         details: error.message || error,
         stack: error.stack || null
      };
   }

   return res.status(statusCode).json(errorResponse);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination metadata
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const paginated = (res, message = 'Success', data = [], pagination = {}, statusCode = 200) => {
   return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
         currentPage: pagination.currentPage || 1,
         totalPages: pagination.totalPages || 1,
         totalCount: pagination.totalCount || data.length,
         limit: pagination.limit || 20,
         hasNext: pagination.hasNext || false,
         hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString()
   });
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @param {string} message - Error message
 */
const validationError = (res, errors, message = 'Validation failed') => {
   return res.status(400).json({
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      timestamp: new Date().toISOString()
   });
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const notFound = (res, resource = 'Resource') => {
   return res.status(404).json({
      success: false,
      message: `${resource} not found`,
      timestamp: new Date().toISOString()
   });
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized access') => {
   return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
   });
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const forbidden = (res, message = 'Access forbidden') => {
   return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
   });
};

module.exports = {
   success,
   error,
   paginated,
   validationError,
   notFound,
   unauthorized,
   forbidden
};
