const PurchaseOrderRoutes = require('express').Router();
const {
   createPurchaseOrder,
   submitPurchaseOrder,
   approvePurchaseOrder,
   rejectPurchaseOrder,
   receivePurchaseOrder,
   getPurchaseOrders,
   getPurchaseOrderById
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
PurchaseOrderRoutes.use(RoleVerifyMiddleware("all"));

// Routes with validation
PurchaseOrderRoutes.post('/', validateCreatePurchaseOrder, createPurchaseOrder);
PurchaseOrderRoutes.get('/', validateGetPurchaseOrders, getPurchaseOrders);
PurchaseOrderRoutes.get('/:id', validatePurchaseOrderId, getPurchaseOrderById);
PurchaseOrderRoutes.patch('/:id/submit', validatePurchaseOrderId, submitPurchaseOrder);
PurchaseOrderRoutes.patch('/:id/approve', validatePurchaseOrderId, approvePurchaseOrder);
PurchaseOrderRoutes.patch('/:id/reject', validateRejectPurchaseOrder, rejectPurchaseOrder);
PurchaseOrderRoutes.patch('/:id/receive', validateReceivePurchaseOrder, receivePurchaseOrder);

module.exports = {
   PurchaseOrderRoutes
}