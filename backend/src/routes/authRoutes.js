const { signup, login, getMe } = require("../controllers/authController");
const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");

const authRouter = require("express").Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);

authRouter.get('/me', RoleVerifyMiddleware('all'), getMe)

module.exports = {
   authRouter,
};