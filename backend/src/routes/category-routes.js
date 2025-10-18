
const { createCategoryController, fetchCategoriesController, UpdateCategory_controller, DeleteCategory_controller } = require('../controllers/categorys/category-controller');
const checkPermissions = require('../middleware/check-permission-middleware');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { PERMISSION_MODULES } = require('../utils/permission-modules');

const CategoryRouter = require('express').Router();
// Bulk upload is now handled by the global /bulk-upload router


CategoryRouter.post('/create-category', RoleVerifyMiddleware("all") , checkPermissions(PERMISSION_MODULES.CATEGORY, 'create'),  createCategoryController)
CategoryRouter.get('/fetch-category', RoleVerifyMiddleware("all") , checkPermissions(PERMISSION_MODULES.CATEGORY, 'read'), fetchCategoriesController)


CategoryRouter.post('/delete', RoleVerifyMiddleware('superadmin', "admin") , checkPermissions(PERMISSION_MODULES.CATEGORY, 'delete'), DeleteCategory_controller);
CategoryRouter.patch('/update', RoleVerifyMiddleware('superadmin', "admin", "manager") , checkPermissions(PERMISSION_MODULES.CATEGORY, 'update'), UpdateCategory_controller);

module.exports = {
   CategoryRouter
}