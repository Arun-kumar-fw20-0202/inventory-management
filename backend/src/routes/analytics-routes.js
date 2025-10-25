const { SummeryController, RevenueTrendsController, TopSellingProductsController, CustomerInsightsController, InventoryTurnoverController, SalesByRegionController, ProfitMarginsController, PurchaseOrderAnalyticsController } = require('../controllers/analytics/analytics-controller');
const checkPermissions = require('../middleware/check-permission-middleware');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');

const AnalyticsRouter = require('express').Router();

AnalyticsRouter.get("/summary", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), SummeryController)

// Revenue Trends
AnalyticsRouter.get("/revenue-trends", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), RevenueTrendsController)
// Top Selling Products
AnalyticsRouter.get("/top-selling-products", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), TopSellingProductsController)
// Customer Insights
AnalyticsRouter.get("/customer-insights", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), CustomerInsightsController)
// Inventory Turnover
AnalyticsRouter.get("/inventory-turnover", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), InventoryTurnoverController)
// Sales by Region
AnalyticsRouter.get("/sales-by-region", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), SalesByRegionController)
// Profit Margins
AnalyticsRouter.get("/profit-margins", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), ProfitMarginsController)

// purchase order analytics
AnalyticsRouter.get("/purchase-order-analytics", RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), PurchaseOrderAnalyticsController)

module.exports = {
    AnalyticsRouter
}