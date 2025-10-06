const { SummeryController, RevenueTrendsController, TopSellingProductsController, CustomerInsightsController, InventoryTurnoverController, SalesByRegionController, ProfitMarginsController } = require('../controllers/analytics/analytics-controller');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');

const AnalyticsRouter = require('express').Router();

AnalyticsRouter.get("/summary", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , SummeryController)

// Revenue Trends
AnalyticsRouter.get("/revenue-trends", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , RevenueTrendsController)
// Top Selling Products
AnalyticsRouter.get("/top-selling-products", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , TopSellingProductsController)
// Customer Insights
AnalyticsRouter.get("/customer-insights", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , CustomerInsightsController)
// Inventory Turnover
AnalyticsRouter.get("/inventory-turnover", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , InventoryTurnoverController)
// Sales by Region
AnalyticsRouter.get("/sales-by-region", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , SalesByRegionController)
// Profit Margins
AnalyticsRouter.get("/profit-margins", RoleVerifyMiddleware('admin', 'manager', 'superadmin') , ProfitMarginsController)

module.exports = {
    AnalyticsRouter
}