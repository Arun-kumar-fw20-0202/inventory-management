const { FetchSessionsController, TerminateSessionController } = require("../controllers/sessions/session-controller");
const { RoleVerifyMiddleware } = require("../middleware/role-verify-middleware");

const SessionRouter = require("express").Router();

SessionRouter.get('/', RoleVerifyMiddleware('admin', 'superadmin'), FetchSessionsController);
SessionRouter.post('/:sessionId', RoleVerifyMiddleware('admin', 'superadmin'), TerminateSessionController);

module.exports = {
    SessionRouter
}