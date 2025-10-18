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
const { BulkUploadRouter } = require("./bulk-upload-route");
const { SendMail } = require("../core/send-mail");
const { DashboardRouter } = require("./dashboard-routes");
const { NotificationRouter } = require("./notification-route");
const { PermissionRouter } = require("./permission-routes");

const AllRoutes = require("express").Router();

AllRoutes.get('/', async (req, res) => {
   try{
      await SendMail({
         template: "<h1>Welcome to Inventory Management</h1><p>Your account has been successfully created.</p>",
         subject: "Welcome to Inventory Management",
         emailTo: "arun07744@gmail.com",
      });
      res.status(200).json({message: "Test mail sent"});
   }
   catch(err){
      res.status(500).json({message: err.message});
   }
})

AllRoutes.use('/permissions', PermissionRouter);

AllRoutes.use('/auth', authRouter);
AllRoutes.use('/user', UserRoutes);

AllRoutes.use('/dashboard', DashboardRouter)

AllRoutes.use('/notifications', NotificationRouter)

AllRoutes.use('/organisation', OrganisationRouter)

AllRoutes.use('/pricing', PricingRouter)

AllRoutes.use("/stock", StockRoutes)
AllRoutes.use("/category", CategoryRouter)
AllRoutes.use('/warehouse', WherehouseRouter)
AllRoutes.use('/bulk-upload', BulkUploadRouter) // to do bulk upload with permissions
AllRoutes.use('/supplier-customers', SupplierCustomerRoutes) // to do supplier-customer with permissions
AllRoutes.use("/purchase-orders", PurchaseOrderRoutes) // to do purchase order with permissions

AllRoutes.use('/sales', SalesRouter)

AllRoutes.use("/analytics", AnalyticsRouter)

AllRoutes.use('/payment', PaymentRouter)

module.exports = {
   AllRoutes
}