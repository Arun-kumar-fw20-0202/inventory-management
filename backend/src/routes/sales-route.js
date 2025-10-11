const SalesRouter = require('express').Router()

const { createSaleSale, SubmitSale, ApproveSale, RejectSale, CompleteSale, GetAllSales, GetSalesAnalytics, GetSaleById, DeleteSale, MarkOrderAsPaid } = require('../controllers/sales/sales.controller');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');

// All routes assume RoleVerifyMiddleware populates req.profile
SalesRouter.post('/', RoleVerifyMiddleware('staff', 'manager', 'admin'), createSaleSale);
SalesRouter.patch('/:id/submit', RoleVerifyMiddleware('manager', 'admin', 'superadmin'), SubmitSale);
SalesRouter.patch('/:id/approve', RoleVerifyMiddleware('admin', 'manager'), ApproveSale);
SalesRouter.patch('/:id/reject', RoleVerifyMiddleware('admin', 'manager'), RejectSale);
SalesRouter.patch('/:id/complete', RoleVerifyMiddleware('admin','manager'), CompleteSale);
SalesRouter.get('/', RoleVerifyMiddleware('all'), GetAllSales);
SalesRouter.get('/analytics', RoleVerifyMiddleware('all'), GetSalesAnalytics);
SalesRouter.get('/:id', RoleVerifyMiddleware('all'), GetSaleById);
SalesRouter.delete('/:id', RoleVerifyMiddleware('admin', 'manager'), DeleteSale);

SalesRouter.patch('/:id/payment-status', RoleVerifyMiddleware('admin', 'manager'), MarkOrderAsPaid);

module.exports = {
    SalesRouter
}