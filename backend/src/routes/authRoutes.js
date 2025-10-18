const { signup, login, getMe, Logoutme } = require("../controllers/authController");
const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");
const { ForgotPasswordRouter } = require("./forgot-password-router");
const { SessionRouter } = require("./sessions-route");

const authRouter = require("express").Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.use('/forgot', ForgotPasswordRouter)

// logout
authRouter.post("/logout", Logoutme);

authRouter.get('/me', RoleVerifyMiddleware('all'), getMe)

authRouter.use('/sessions' , SessionRouter) 

module.exports = {
   authRouter,
};