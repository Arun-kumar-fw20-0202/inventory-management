const { PhonePeRouter } = require('./phonepe-router');
const { RazorpayRouter } = require('./razorpay-router');

const PaymentRouter = require('express').Router();

PaymentRouter.use('/razorpay', RazorpayRouter);
PaymentRouter.use('/phone-pe', PhonePeRouter);



module.exports = {
    PaymentRouter
}