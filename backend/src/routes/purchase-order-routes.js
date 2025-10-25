const PurchaseOrderRoutes = require('express').Router();
const {
   createPurchaseOrder,
   submitPurchaseOrder,
   approvePurchaseOrder,
   rejectPurchaseOrder,
   receivePurchaseOrder,
   getPurchaseOrders,
   getPurchaseOrderById,
} = require('../controllers/purchase-order/purchase-controller');
const checkPermissions = require('../middleware/check-permission-middleware');

// Import middleware
const {
   validateCreatePurchaseOrder,
   validateReceivePurchaseOrder,
   validatePurchaseOrderId,
   validateGetPurchaseOrders,
   validateRejectPurchaseOrder
} = require('../middleware/purchase-order-validation');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');

// Apply authentication middleware to all routes
// PurchaseOrderRoutes.use();

// Routes with validation
PurchaseOrderRoutes.post('/', validateCreatePurchaseOrder,RoleVerifyMiddleware("all") , checkPermissions(PERMISSION_MODULES.PURCHASES, 'create'), createPurchaseOrder);
PurchaseOrderRoutes.get('/', validateGetPurchaseOrders,RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'read'), getPurchaseOrders);
PurchaseOrderRoutes.get('/:id', validatePurchaseOrderId, RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.PURCHASES, 'read'), getPurchaseOrderById);

// to do with permissions
PurchaseOrderRoutes.patch('/:id/submit', validatePurchaseOrderId, RoleVerifyMiddleware("all"), submitPurchaseOrder);
// approval/rejection/receive require explicit module permissions
PurchaseOrderRoutes.patch('/:id/approve', validatePurchaseOrderId, RoleVerifyMiddleware('admin', 'manager'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'can-approve'), approvePurchaseOrder);
PurchaseOrderRoutes.patch('/:id/reject', validateRejectPurchaseOrder,RoleVerifyMiddleware('admin', 'manager'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'can-reject'), rejectPurchaseOrder);
PurchaseOrderRoutes.patch('/:id/receive', validateReceivePurchaseOrder, RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'can-receive'), receivePurchaseOrder);


module.exports = {
   PurchaseOrderRoutes
}