const { AnalyticsRouter } = require("./analytics-routes");
const { authRouter } = require("./authRoutes");
const { CategoryRouter } = require("./category-routes");
const { OrganisationRouter } = require("./organisation-routes");
const { PricingRouter } = require("./pricing-route");
const { PurchaseOrderRoutes } = require("./purchase-order-routes");
const { PaymentRouter } = require("./payment/pyament-routes");
const { SalesRouter } = require("./sales-route");
const { StockRoutes } = require("./stock-route");
const { SupplierCustomerRoutes } = require("./supplier-customer-routes");
const { UserRoutes } = require("./user-routes");
const { WherehouseRouter } = require("./wherehouse-route");

const AllRoutes = require("express").Router();

AllRoutes.use('/auth', authRouter);
AllRoutes.use('/user', UserRoutes);

AllRoutes.use('/organisation', OrganisationRouter)

AllRoutes.use('/pricing', PricingRouter)

AllRoutes.use("/stock", StockRoutes)
AllRoutes.use("/category", CategoryRouter)
AllRoutes.use('/warehouse', WherehouseRouter)
AllRoutes.use('/supplier-customers', SupplierCustomerRoutes)
AllRoutes.use("/purchase-orders", PurchaseOrderRoutes)

AllRoutes.use('/sales', SalesRouter)

AllRoutes.use("/analytics", AnalyticsRouter)

AllRoutes.use('/payment', PaymentRouter)

module.exports = {
   AllRoutes
}