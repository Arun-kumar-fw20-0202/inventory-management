const { CreateRazorpayOrderController, VerifyRazorpayPaymentController } = require('../../controllers/payment/razorpay-controller');
const { RoleVerifyMiddleware } = require('../../middleware/role-verify-middleware');

const RazorpayRouter = require('express').Router();


// Create order (supports both one-time and subscription)
RazorpayRouter.post('/create-order', RoleVerifyMiddleware("all"), CreateRazorpayOrderController);

// Verify payment (supports both one-time and subscription)
RazorpayRouter.post('/verify', RoleVerifyMiddleware("all"), VerifyRazorpayPaymentController);

module.exports = {
    RazorpayRouter
}