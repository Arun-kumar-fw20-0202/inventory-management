const PricingRouter = require('express').Router();
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware')
const { createPlan, fetchPlans, getPlanById, updatePlan, deletePlan } = require('../controllers/pricing/pricing-controller')

// Public for read-only: authenticated users can view plans
PricingRouter.get('/', RoleVerifyMiddleware('all'), fetchPlans)
PricingRouter.get('/:id', RoleVerifyMiddleware('all'), getPlanById)

// Only superadmin can create/update/delete
PricingRouter.post('/', RoleVerifyMiddleware('superadmin'), createPlan)
PricingRouter.put('/:id', RoleVerifyMiddleware('superadmin'), updatePlan)
PricingRouter.delete('/:id', RoleVerifyMiddleware('superadmin'), deletePlan)

module.exports = {
    PricingRouter
}