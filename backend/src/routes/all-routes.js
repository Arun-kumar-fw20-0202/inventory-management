const { authRouter } = require("./authRoutes");
const { CategoryRouter } = require("./category-routes");
const { PurchaseOrderRoutes } = require("./purchase-order-routes");
const { StockRoutes } = require("./stock-route");
const { SupplierCustomerRoutes } = require("./supplier-customer-routes");
const { WherehouseRouter } = require("./wherehouse-route");

const AllRoutes = require("express").Router();

AllRoutes.use('/auth', authRouter);

AllRoutes.use("/stock", StockRoutes)
AllRoutes.use("/category", CategoryRouter)
AllRoutes.use('/warehouse', WherehouseRouter)
AllRoutes.use('/supplier-customers', SupplierCustomerRoutes)
AllRoutes.use("/purchase-orders", PurchaseOrderRoutes)

module.exports = {
   AllRoutes
}