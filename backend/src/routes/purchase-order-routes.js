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

// Import middleware
const {
   validateCreatePurchaseOrder,
   validateReceivePurchaseOrder,
   validatePurchaseOrderId,
   validateGetPurchaseOrders,
   validateRejectPurchaseOrder
} = require('../middleware/purchase-order-validation');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');

// Apply authentication middleware to all routes
// PurchaseOrderRoutes.use();

// Routes with validation
PurchaseOrderRoutes.post('/', validateCreatePurchaseOrder,RoleVerifyMiddleware("all") , createPurchaseOrder);
PurchaseOrderRoutes.get('/', validateGetPurchaseOrders,RoleVerifyMiddleware('all'), getPurchaseOrders);
PurchaseOrderRoutes.get('/:id', validatePurchaseOrderId, RoleVerifyMiddleware("all"), getPurchaseOrderById);
PurchaseOrderRoutes.patch('/:id/submit', validatePurchaseOrderId, RoleVerifyMiddleware("manager" , 'admin'), submitPurchaseOrder);
PurchaseOrderRoutes.patch('/:id/approve', validatePurchaseOrderId, RoleVerifyMiddleware('admin'), approvePurchaseOrder);
PurchaseOrderRoutes.patch('/:id/reject', validateRejectPurchaseOrder,RoleVerifyMiddleware('admin'), rejectPurchaseOrder);
PurchaseOrderRoutes.patch('/:id/receive', validateReceivePurchaseOrder, RoleVerifyMiddleware('admin', 'manager'), receivePurchaseOrder);


module.exports = {
   PurchaseOrderRoutes
}