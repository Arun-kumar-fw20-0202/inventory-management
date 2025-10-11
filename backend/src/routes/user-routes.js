const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");
const { createUser, fetchUsers, getUserById, updateUser, deleteUser } = require('../controllers/user/user-controller')

const UserRoutes = require("express").Router();

// All routes require authentication (middleware populates req.profile)
UserRoutes.use(RoleVerifyMiddleware('all'))

// Create user
UserRoutes.post('/', createUser)

// Fetch list
UserRoutes.get('/', fetchUsers)

// Get by id
UserRoutes.get('/:id', getUserById)

// Update
UserRoutes.put('/:id', updateUser)

// Delete (soft/hard via query ?hard=true)
UserRoutes.delete('/:id', deleteUser)

module.exports = {
    UserRoutes
}