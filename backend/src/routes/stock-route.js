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
const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");

const StockRoutes = require("express").Router();

// Create stock
StockRoutes.post("/create", RoleVerifyMiddleware("superadmin", "admin", "manager"), createStockController);

// Update stock
StockRoutes.patch('/:id', RoleVerifyMiddleware("superadmin", "admin", "manager"), updateStockController);

// Delete stock
StockRoutes.delete('/:id', RoleVerifyMiddleware("superadmin", "admin", "manager"), deleteStockController);

// Bulk operations
StockRoutes.patch('/bulk/update', RoleVerifyMiddleware("superadmin", "admin", "manager"), bulkUpdateStockController);

// Search stock with advanced relevance
StockRoutes.get('/search', RoleVerifyMiddleware("superadmin", "admin", "manager", "staff"), searchStockController);

// Get low stock alerts
StockRoutes.get('/alerts/low-stock', RoleVerifyMiddleware("superadmin", "admin", "manager", "staff"), getLowStockAlertsController);

// Get analytics (specific route before general routes)
StockRoutes.get('/analytics', RoleVerifyMiddleware("superadmin", "admin", "manager", "staff"), getStockAnalyticsController);

// Get by id
StockRoutes.get('/:id', RoleVerifyMiddleware("superadmin", "admin", "manager", "staff"), getStockByIdController);

// Get all stock (most general route last)
StockRoutes.get('/', RoleVerifyMiddleware("superadmin", "admin", "manager", "staff"), getAllStockController);

module.exports = {
   StockRoutes
};