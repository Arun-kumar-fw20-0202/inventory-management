const express = require('express')
const ForgotPasswordRouter = express.Router();
const { requestReset, validateToken, resetPassword } = require('../controllers/forgot/forgot-password-controller')

// Request a password reset (sends email if account exists)
ForgotPasswordRouter.post('/', requestReset)

// Validate token (used by frontend to check token validity)
ForgotPasswordRouter.post('/validate', validateToken)

// Reset password
ForgotPasswordRouter.post('/reset', resetPassword)

module.exports = {
    ForgotPasswordRouter,
}