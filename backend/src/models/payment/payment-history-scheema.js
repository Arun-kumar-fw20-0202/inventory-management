const mongoose = require("mongoose");


const PaymentHistoryScheema = mongoose.model("PaymentHistory", new mongoose.Schema({
   pricing_id: { type: mongoose.Schema.Types.ObjectId, ref: "pricing" },
   paymentDate: { type: Date, default: Date.now },
   amount: { type: Number, required: true },
   currency: { type: String, default: 'INR' },
   willExpire: { type: Date, required: true },
   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
   
   // Payment identifiers - unified for all gateways
   payment_id: { type: String }, // Transaction ID
   order_id: { type: String }, // Order ID
   
   // Payment gateway and method
   payment_method: { 
      type: String, 
      enum: ['razorpay', 'phonepe', 'other'], 
      required: true 
   },

   paymentType: { 
      type: String, 
      enum: ['monthly', 'yearly'], 
      required: true 
   },
   
   // Payment type
   payment_type: { 
      type: String, 
      enum: ['one-time', 'subscription'], 
      default: 'one-time' 
   },
   
   // Payment status
   status: {
      type: String,
      enum: ['created', 'pending', 'completed', 'failed', 'cancelled', 'expired'],
      default: 'created'
   },
   
   // Gateway specific fields for Razorpay
   razorpayOrderId: String,
   razorpayPaymentId: String,

   notes: { type: mongoose.Schema.Types.Mixed }
   
}, { timestamps: true }));

module.exports = {
   PaymentHistoryScheema
};
