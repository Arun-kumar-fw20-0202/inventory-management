const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return error(res, 'Validation failed', errors.array(), 400);
   }
   next();
};

/**
 * Validation rules for creating purchase order
 */
const validateCreatePurchaseOrder = [
   body('supplierId')
      .isMongoId()
      .withMessage('Valid supplier ID is required'),
   
   body('warehouseId')
      .isMongoId()
      .withMessage('Valid warehouse ID is required'),
   
   body('items')
      .isArray({ min: 1 })
      .withMessage('Items array is required and must not be empty'),
   
   body('items.*.productId')
      .isMongoId()
      .withMessage('Valid product ID is required for each item'),
   
   body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
   
   body('items.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number'),
   
   body('expectedDeliveryDate')
      .optional()
      .isISO8601()
      .withMessage('Expected delivery date must be a valid date'),
   
   body('notes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
   
   handleValidationErrors
];

/**
 * Validation rules for receiving items
 */
const validateReceivePurchaseOrder = [
   param('id')
      .isMongoId()
      .withMessage('Valid purchase order ID is required'),
   
   body('receivedItems')
      .isArray({ min: 1 })
      .withMessage('Received items array is required and must not be empty'),
   
   body('receivedItems.*.productId')
      .isMongoId()
      .withMessage('Valid product ID is required for each received item'),
   
   body('receivedItems.*.receivedQuantity')
      .isInt({ min: 1 })
      .withMessage('Received quantity must be a positive integer'),
   
   handleValidationErrors
];

/**
 * Validation rules for purchase order ID parameter
 */
const validatePurchaseOrderId = [
   param('id')
      .isMongoId()
      .withMessage('Valid purchase order ID is required'),
   
   handleValidationErrors
];

/**
 * Validation rules for getting purchase orders with query filters
 */
const validateGetPurchaseOrders = [
   query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
   
   query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
   
   query('status')
      .optional()
      .isIn(['all','Draft', 'PendingApproval', 'Approved', 'PartiallyReceived', 'Completed', 'Cancelled'])
      .withMessage('Invalid status value'),
   
   query('supplierId')
      .optional()
      .isMongoId()
      .withMessage('Valid supplier ID is required'),
   
   query('warehouseId')
      .optional()
      .isMongoId()
      .withMessage('Valid warehouse ID is required'),
   
   query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
   
   query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
   
   handleValidationErrors
];

/**
 * Validation rules for rejection reason
 */
const validateRejectPurchaseOrder = [
   param('id')
      .isMongoId()
      .withMessage('Valid purchase order ID is required'),
   
   body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Rejection reason cannot exceed 500 characters'),
   
   handleValidationErrors
];

module.exports = {
   validateCreatePurchaseOrder,
   validateReceivePurchaseOrder,
   validatePurchaseOrderId,
   validateGetPurchaseOrders,
   validateRejectPurchaseOrder,
   handleValidationErrors
};