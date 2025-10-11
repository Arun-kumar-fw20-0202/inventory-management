const OrganisationRouter = require('express').Router()
const { createOrganisation, listOrganisations,  getMyOrganisation, getOrganisationById, updateOrganisation, deleteOrganisation, listOrganisationMembers } = require('../controllers/organisation/organisation-controller')
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware')

// Public: (if needed) - keeping routes protected by role middleware where appropriate
OrganisationRouter.post('/', RoleVerifyMiddleware('superadmin'), createOrganisation)
OrganisationRouter.get('/', RoleVerifyMiddleware('superadmin'), listOrganisations)
OrganisationRouter.get('/me', RoleVerifyMiddleware('admin'), getMyOrganisation)
OrganisationRouter.get('/:id', RoleVerifyMiddleware('superadmin', 'admin'), getOrganisationById)
OrganisationRouter.patch('/', RoleVerifyMiddleware('superadmin', 'admin'), updateOrganisation)
OrganisationRouter.delete('/:id', RoleVerifyMiddleware('superadmin'), deleteOrganisation)

// members listing
OrganisationRouter.get('/:id/members', RoleVerifyMiddleware('superadmin', 'admin', 'manager'), listOrganisationMembers)

module.exports = { OrganisationRouter }