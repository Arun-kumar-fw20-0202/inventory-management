const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema({
   productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
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
      min: 0,
   },
   total: {
      type: Number,
      required: true,
      min: 0,
   },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema(
   {
      supplierId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "SupplierCustomer",
         required: true,
         index: true,
      },
      warehouseId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Warehouse",
         required: true,
         index: true,
      },
      orderNumber: {
         type: String,
         unique: true,
         required: true,
         index: true,
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
         index: true,
      },
      totalAmount: {
         type: Number,
         required: true,
         min: 0,
      },
      expectedDeliveryDate: {
         type: Date,
         index: true,
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
         trim: true,
         maxlength: 1000,
      },
      orgNo: {
         type: String,
         required: true,
         index: true,
      },
   },
   { 
      timestamps: true,
      versionKey: false,
   }
);

// Pre-save hook to auto-calculate totalAmount
purchaseOrderSchema.pre('save', function(next) {
   if (this.items && this.items.length > 0) {
      this.totalAmount = this.items.reduce((total, item) => {
         item.total = item.quantity * item.unitPrice;
         return total + item.total;
      }, 0);
   }
   next();
});

// Compound indexes for better query performance
purchaseOrderSchema.index({ supplierId: 1, status: 1 });
purchaseOrderSchema.index({ warehouseId: 1, status: 1 });
purchaseOrderSchema.index({ createdAt: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1, status: 1 });


const PurchaseOrderModal = mongoose.model("PurchaseOrder", purchaseOrderSchema);
module.exports = {
   PurchaseOrderModal
}