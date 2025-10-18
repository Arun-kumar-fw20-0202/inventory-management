const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");
const { createUser, fetchUsers, getUserById, updateUser, deleteUser } = require('../controllers/user/user-controller');
const { PERMISSION_MODULES } = require("../utils/permission-modules");
const checkPermissions = require("../middleware/check-permission-middleware");

const UserRoutes = require("express").Router();

// All routes require authentication (middleware populates req.profile)
// UserRoutes.use(RoleVerifyMiddleware('all'))

// Create user
UserRoutes.post('/', RoleVerifyMiddleware('superadmin', 'admin', 'manager'), checkPermissions(PERMISSION_MODULES.SYSTEMUSER, 'create'), createUser)

// Fetch list
UserRoutes.get('/', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SYSTEMUSER, 'read'), fetchUsers)

// Get by id
UserRoutes.get('/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.SYSTEMUSER, 'read'), getUserById)

// Update
UserRoutes.put('/:id', RoleVerifyMiddleware('superadmin', 'admin', 'manager'), checkPermissions(PERMISSION_MODULES.SYSTEMUSER, 'update') , updateUser)

// Delete (soft/hard via query ?hard=true)
UserRoutes.delete('/:id', RoleVerifyMiddleware('superadmin', 'admin', 'manager'), checkPermissions(PERMISSION_MODULES.SYSTEMUSER, 'delete'), deleteUser)

module.exports = {
    UserRoutes
}