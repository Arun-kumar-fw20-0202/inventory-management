const mongoose = require('mongoose');

const saleOrderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SupplierCustomer",
    required: true,
  },
  items: [
    {
      stockId: { type: mongoose.Schema.Types.ObjectId, ref: "Stock", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    },
  ],
  subTotal: Number,
  tax: Number,
    taxType: {
    type: String,
    enum: ['fixed', 'percentage'],
  },
  discount: Number,
  grandTotal: Number,
  status: {
    type: String,
    enum: ["draft", "submitted", "approved", "rejected", "completed"],
    default: "draft",
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "partial", "paid"],
    default: "unpaid",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // approval / rejection / completion metadata
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedReason: { type: String },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
  markedAsPaidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
  },
  orgNo: {
    type: String,
    required: true,
  },
}, { timestamps: true });


// discreese stockCount in warehouse when sale is completed
// saleOrderSchema.post('save', async function(doc, next) {
//   if (doc.status === 'completed') {
//     const Stock = mongoose.model('Stock');
//     for (const item of doc.items) {
//       await Stock.findByIdAndUpdate(item.stockId, { $inc: { quantity: -item.quantity } });
//     }
//   }
//   next();
// });


// saleOrderSchema.index({ orgNo: 1, orderNo: 1 });
const SaleOrder = mongoose.model('SaleOrder', saleOrderSchema);
module.exports = {
    SaleOrder
};
