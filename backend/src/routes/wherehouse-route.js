const express = require('express');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { createWherehouse_controller, get_AllWherehouses_controller, get_WherehouseById_controller, DeleteWarehouse_controller, UpdateWarehouse_controller } = require('../controllers/wherehouse.controller');
const checkPermissions = require('../middleware/check-permission-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');
const WherehouseRouter = express.Router();
// Bulk upload is handled by the global /bulk-upload router


WherehouseRouter.post('/create', RoleVerifyMiddleware('superadmin', "admin", "manager") , checkPermissions(PERMISSION_MODULES.WAREHOUSE, 'create'), createWherehouse_controller);
WherehouseRouter.get('/fetch', RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.WAREHOUSE, 'read'), get_AllWherehouses_controller);
WherehouseRouter.get('/:id', RoleVerifyMiddleware('all') , checkPermissions(PERMISSION_MODULES.WAREHOUSE, 'read'), get_WherehouseById_controller);
WherehouseRouter.post('/delete', RoleVerifyMiddleware('superadmin', "admin") , checkPermissions(PERMISSION_MODULES.WAREHOUSE, 'delete'), DeleteWarehouse_controller);
WherehouseRouter.patch('/update', RoleVerifyMiddleware('superadmin', "admin", "manager") , checkPermissions(PERMISSION_MODULES.WAREHOUSE, 'update'), UpdateWarehouse_controller);

// Bulk upload endpoints moved to global /bulk-upload


module.exports = {
   WherehouseRouter
};