const { 
   createStockController, 
   updateStockController, 
   deleteStockController, 
   getStockByIdController, 
   getAllStockController, 
   bulkUpdateStockController,
   searchStockController,
   getLowStockAlertsController,
   getStockAnalyticsController 
} = require("../controllers/stock/stock-controller");
const checkPermissions = require("../middleware/check-permission-middleware");
const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");
const { PERMISSION_MODULES } = require("../utils/permission-modules");
const { StockAttachmentsRoutes } = require("./stock-attachments-route");

const StockRoutes = require("express").Router();


// Attachment routes
StockRoutes.use('/', StockAttachmentsRoutes);


// Create stock
StockRoutes.post("/create", RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.STOCK, 'create'), createStockController);

// Update stock
StockRoutes.patch('/:id', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.STOCK, 'update'), updateStockController);

// Delete stock
StockRoutes.delete('/:id', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.STOCK, 'delete'), deleteStockController);

// Bulk operations
StockRoutes.patch('/bulk/update', RoleVerifyMiddleware("all"), bulkUpdateStockController);

// Search stock with advanced relevance
StockRoutes.get('/search', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), searchStockController);

// Get low stock alerts
StockRoutes.get('/alerts/low-stock', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), getLowStockAlertsController);

// Get analytics (specific route before general routes)
StockRoutes.get('/analytics', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), getStockAnalyticsController);

// Get by id
StockRoutes.get('/:id', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), getStockByIdController);

// Get all stock (most general route last)
StockRoutes.get('/', RoleVerifyMiddleware("all"), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), getAllStockController);



module.exports = {
   StockRoutes
};