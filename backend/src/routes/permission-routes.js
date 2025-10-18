const PermissionRouter = require('express').Router();
const { CreateOrUpdateUserPermissions, GetUserPermissions, ResetDefaultPermissions, FetchMyPermissions } = require('../controllers/permission/permission-controller');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware')

// Fetch my permissions 
PermissionRouter.get('/me', RoleVerifyMiddleware('all'), FetchMyPermissions)

// Create or update permissions for a specific user (idempotent)
PermissionRouter.post('/:userId', RoleVerifyMiddleware('superadmin', 'admin'), CreateOrUpdateUserPermissions)

// Fetch permissions for a specific user
PermissionRouter.get('/:userId', RoleVerifyMiddleware('superadmin', 'admin', 'manager'), GetUserPermissions)

// Reset a user's permissions to role-based defaults
PermissionRouter.post('/:userId/reset', RoleVerifyMiddleware('superadmin', 'admin'), ResetDefaultPermissions)

module.exports = {
    PermissionRouter
}