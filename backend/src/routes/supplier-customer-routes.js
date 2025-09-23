const express = require('express');
const SupplierCustomerRoutes = express.Router();
const {
   getAllSupplierCustomers,
   getSupplierCustomerById,
   createSupplierCustomer,
   updateSupplierCustomer,
   deleteSupplierCustomer,
   bulkOperations,
   searchSupplierCustomers,
   getAnalytics,
   updateTransactionMetrics
} = require('../controllers/customer-supplier/customer-supplier.controller');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');


// ============================
// READ OPERATIONS
// ============================

/**
 * @route   GET /api/supplier-customers
 * @desc    Get all supplier/customers with advanced filtering
 * @access  Private (All authenticated users)
 */
SupplierCustomerRoutes.get('/',  
   RoleVerifyMiddleware('all'),
   getAllSupplierCustomers
);

/**
 * @route   GET /api/supplier-customers/search
 * @desc    Search supplier/customers
 * @access  Private (All authenticated users)
 */
SupplierCustomerRoutes.get('/search',  
   RoleVerifyMiddleware('all'),
   searchSupplierCustomers
);

/**
 * @route   GET /api/supplier-customers/analytics
 * @desc    Get analytics for supplier/customers
 * @access  Private (Manager+ only)
 */
SupplierCustomerRoutes.get('/analytics',  
   RoleVerifyMiddleware('manager', 'admin', 'superadmin'),
   getAnalytics
);

/**
 * @route   GET /api/supplier-customers/:id
 * @desc    Get supplier/customer by ID
 * @access  Private (All authenticated users)
 */
SupplierCustomerRoutes.get('/:id',  
   RoleVerifyMiddleware('all'),
   getSupplierCustomerById
);

// ============================
// WRITE OPERATIONS
// ============================

/**
 * @route   POST /api/supplier-customers
 * @desc    Create new supplier/customer
 * @access  Private (Staff+ only)
 */
SupplierCustomerRoutes.post('/',  
   RoleVerifyMiddleware('staff', 'manager', 'admin', 'superadmin'),
   createSupplierCustomer
);

/**
 * @route   PUT /api/supplier-customers/:id
 * @desc    Update supplier/customer
 * @access  Private (Staff+ only)
 */
SupplierCustomerRoutes.put('/:id',  
   RoleVerifyMiddleware('staff', 'manager', 'admin', 'superadmin'),
   updateSupplierCustomer
);

/**
 * @route   DELETE /api/supplier-customers/:id
 * @desc    Delete supplier/customer (soft delete)
 * @access  Private (Manager+ only)
 */
SupplierCustomerRoutes.delete('/:id',  
   RoleVerifyMiddleware('manager', 'admin', 'superadmin'),
   deleteSupplierCustomer
);

/**
 * @route   POST /api/supplier-customers/bulk
 * @desc    Bulk operations on supplier/customers
 * @access  Private (Manager+ only)
 */
SupplierCustomerRoutes.post('/bulk',  
   RoleVerifyMiddleware('manager', 'admin', 'superadmin'),
   bulkOperations
);

/**
 * @route   PATCH /api/supplier-customers/:id/transaction
 * @desc    Update transaction metrics
 * @access  Private (Staff+ only)
 */
SupplierCustomerRoutes.patch('/:id/transaction',  
   RoleVerifyMiddleware('staff', 'manager', 'admin', 'superadmin'),
   updateTransactionMetrics
);

module.exports = {
   SupplierCustomerRoutes
};