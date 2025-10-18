const {  CheckPhonePeStatusController, CreatePhonePeOrderController } = require('../../controllers/payment/phonepe-controller');
const { RoleVerifyMiddleware } = require('../../middleware/role-verify-middleware');

const PhonePeRouter = require('express').Router();

PhonePeRouter.post('/create-order', RoleVerifyMiddleware('all'), CreatePhonePeOrderController);
PhonePeRouter.get('/check-status/:merchantId', RoleVerifyMiddleware('all'), CheckPhonePeStatusController);


module.exports = {
	PhonePeRouter
};