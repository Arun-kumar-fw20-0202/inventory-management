const { TopProductsController, LowStockProductsController, RecentSalesController, SalesSummaryController, RevenueSummaryController, ExpenseSummaryController, InventorySummaryController, CustomerSummaryController, SupplierSummaryController, PurchaseOrderSummaryController, RecentCustomersController, RecentSuppliersController, PendingPurchaseOrdersController, OverduePurchaseOrdersController, TopCustomersController, TopSuppliersController } = require('../controllers/dashboard/dashboard-controller');
const checkPermissions = require('../middleware/check-permission-middleware');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');

const DashboardRouter = require('express').Router();

// for staff / Managers
DashboardRouter.get("/top-product", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'read'), TopProductsController);
DashboardRouter.get("/low-stock-products", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), LowStockProductsController);
DashboardRouter.get("/recent-sales", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'read'), RecentSalesController);
DashboardRouter.get("/sales-summary", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'read'), SalesSummaryController);
DashboardRouter.get("/revenue-summary", RoleVerifyMiddleware('all'),checkPermissions(PERMISSION_MODULES.SALES, 'read'), RevenueSummaryController);
// DashboardRouter.get("/expense-summary", RoleVerifyMiddleware('all'), ExpenseSummaryController);
DashboardRouter.get("/inventory-summary", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), InventorySummaryController);
DashboardRouter.get("/customer-summary", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.CUSTOMER, 'read'), CustomerSummaryController);
DashboardRouter.get("/supplier-summary", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SUPPLIER, 'read'), SupplierSummaryController);
DashboardRouter.get("/purchase-order-summary", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'read'), PurchaseOrderSummaryController);

DashboardRouter.get("/recent-customers", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.CUSTOMER, 'read'), RecentCustomersController);
DashboardRouter.get("/recent-suppliers", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SUPPLIER, 'read'), RecentSuppliersController);
DashboardRouter.get("/pending-purchase-orders", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'read'), PendingPurchaseOrdersController);
DashboardRouter.get("/overdue-purchase-orders", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PURCHASES, 'read'), OverduePurchaseOrdersController);
DashboardRouter.get("/top-customers", RoleVerifyMiddleware('all'), TopCustomersController);
// DashboardRouter.get("/top-suppliers", RoleVerifyMiddleware('all'), TopSuppliersController);

module.exports = {
    DashboardRouter
};