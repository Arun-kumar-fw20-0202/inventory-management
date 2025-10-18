const PricingRouter = require('express').Router();
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware')
const { createPlan, fetchPlans, getPlanById, updatePlan, deletePlan } = require('../controllers/pricing/pricing-controller');
const { PERMISSION_MODULES } = require('../utils/permission-modules');
const checkPermissions = require('../middleware/check-permission-middleware');

// Public for read-only: authenticated users can view plans
PricingRouter.get('/', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PRICING, 'read'), fetchPlans)
PricingRouter.get('/:id', RoleVerifyMiddleware('all'), checkPermissions(PERMISSION_MODULES.PRICING, 'read'), getPlanById)

// Only superadmin can create/update/delete
PricingRouter.post('/', RoleVerifyMiddleware('superadmin'), createPlan)
PricingRouter.put('/:id', RoleVerifyMiddleware('superadmin'), updatePlan)
PricingRouter.delete('/:id', RoleVerifyMiddleware('superadmin'), deletePlan)

module.exports = {
    PricingRouter
}