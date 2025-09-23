const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema({
   productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
   },
   quantity: {
      type: Number,
      required: true,
      min: 1,
   },
   unitPrice: {
      type: Number,
      required: true,
      min: 0,
   },
   receivedQuantity: {
      type: Number,
      default: 0,
   },
   total: {
      type: Number,
      required: true,
   },
});

const purchaseOrderSchema = new mongoose.Schema(
   {
      supplierId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "SupplierCustomer",
         required: true,
      },
      warehouseId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
         required: true,
      },
      orgNo: {
         type: String,
         unique: true,
         required: true,
      },
      items: [purchaseOrderItemSchema],
      status: {
         type: String,
         enum: [
         "Draft",
         "PendingApproval",
         "Approved",
         "PartiallyReceived",
         "Completed",
         "Cancelled",
         ],
         default: "Draft",
      },
      totalAmount: {
         type: Number,
         required: true,
      },
      expectedDeliveryDate: {
         type: Date,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      approvedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      notes: {
         type: String,
      },
   },
   { timestamps: true }
);

const PurchaseOrderModal = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = {
   PurchaseOrderModal
}