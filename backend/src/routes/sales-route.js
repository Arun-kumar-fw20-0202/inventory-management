const SalesRouter = require('express').Router()

const { createSaleSale, SubmitSale, ApproveSale, RejectSale, CompleteSale, GetAllSales, GetSalesAnalytics, GetSaleById, DeleteSale, MarkOrderAsPaid, UpdateSaleController } = require('../controllers/sales/sales.controller');
const checkPermissions = require('../middleware/check-permission-middleware');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');

// All routes assume RoleVerifyMiddleware populates req.profile
SalesRouter.post('/', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'create'), createSaleSale);

SalesRouter.patch("/:id/update", RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'update'), UpdateSaleController); 

SalesRouter.patch('/:id/submit', RoleVerifyMiddleware('all'), SubmitSale);

// Approval/rejection/complete routes require specific permissions
SalesRouter.patch('/:id/approve', RoleVerifyMiddleware('admin', 'manager', 'superadmin'), checkPermissions(PERMISSION_MODULES.SALES, 'can-approve'), ApproveSale);

SalesRouter.patch('/:id/reject', RoleVerifyMiddleware('admin', 'manager', 'superadmin'), checkPermissions(PERMISSION_MODULES.SALES, 'can-reject'), RejectSale);

SalesRouter.patch('/:id/complete', RoleVerifyMiddleware('admin','manager'), checkPermissions(PERMISSION_MODULES.SALES, 'can-complete'), CompleteSale);

SalesRouter.get('/', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'read'), GetAllSales);

SalesRouter.get('/analytics', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.REPORTS, 'read'), GetSalesAnalytics);

SalesRouter.get('/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'read'), GetSaleById);

SalesRouter.delete('/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'delete'), DeleteSale);

SalesRouter.patch('/:id/payment-status', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SALES, 'update'), MarkOrderAsPaid);

module.exports = {
    SalesRouter
}