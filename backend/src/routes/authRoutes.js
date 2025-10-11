const { signup, login, getMe, Logoutme } = require("../controllers/authController");
const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");

const authRouter = require("express").Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
// logout
authRouter.post("/logout", Logoutme);

authRouter.get('/me', RoleVerifyMiddleware('all'), getMe)

module.exports = {
   authRouter,
};