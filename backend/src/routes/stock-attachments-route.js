const StockAttachmentsRoutes = require('express').Router();
const { createAttachment, listAttachmentsByStock, getAttachmentById, updateAttachment, deleteAttachment, adjustAttachmentQty, attachAttachmentToStockController } = require('../controllers/stock/stock-attachments-controller');
const checkPermissions = require('../middleware/check-permission-middleware');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');

// Create attachment for a stock item
StockAttachmentsRoutes.post('/attachments', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'create'), createAttachment);

// List attachments for a stock item
StockAttachmentsRoutes.get('/attachments', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), listAttachmentsByStock);

// Get single attachment by id
StockAttachmentsRoutes.get('/attachments/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'read'), getAttachmentById);

// Update
StockAttachmentsRoutes.patch('/attachments/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'update'), updateAttachment);

// Delete
StockAttachmentsRoutes.delete('/attachments/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'delete'), deleteAttachment);

// Bulk adjust quantities (admin managers will use this when receiving/consuming attachments)
StockAttachmentsRoutes.post('/attachments/adjust', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'update'), adjustAttachmentQty);

// attach or deattach attachments to stock items
StockAttachmentsRoutes.post('/attachments/attach', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.STOCK, 'update'), attachAttachmentToStockController);

module.exports = {
  StockAttachmentsRoutes
};
