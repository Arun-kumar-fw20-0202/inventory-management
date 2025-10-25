const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    orgNo: { 
      type: String, 
      required: true, 
      index: true, // for filtering by organization
      description: "Unique identifier for organization/company"
    },

    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      description: "User who created this stock item"
    },

    updatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      description: "User who last updated this stock item"
    },

    productName: { 
      type: String, 
      required: true, 
      trim: true,
      index: true // for search operations
    },

    sku: { 
      type: String, 
      required: true, 
      trim: true, 
      uppercase: true,
      description: "Stock Keeping Unit, unique for each product"
    },

    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "category", 
      required: true, 
      index: true // for category filtering
    },

    attachmentsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "stock_attachments",
    },

    attachmentsCount: {
      type: Number,
      validate: {
        validator: Number.isInteger,
        message: 'attachmentsCount must be an integer'
      }
    },
    totalAttachmentCount: {
      type: Number,
      validate: {
        validator: Number.isInteger,
        message: 'totalAttachmentCount must be an integer'
      }
    },

    warehouse: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Warehouse",
      required: true, 
      index: true // for warehouse filtering
    },

    description: { type: String, default: "", trim: true },

    quantity: { 
      type: Number, 
      required: true, 
      default: 0, 
      min: 0,
      index: true // for low stock queries
    },

    unit: { 
      type: String, 
      enum: ["pcs", "kg", "ltr", "box", "packet"], 
      default: "pcs",
      index: true // for unit-wise analytics
    },

    purchasePrice: { 
      type: Number, 
      required: true, 
      min: 0,
      index: true // for price range queries
    },

    sellingPrice: { 
      type: Number, 
      required: true, 
      min: 0,
      index: true // for price range queries
    },

    lowStockThreshold: { type: Number, default: 5, min: 0 },

    status: { 
      type: String, 
      enum: ["active", "inactive", "archived"], 
      default: "active",
      index: true // for status filtering
    },

    tags: [{ type: String }], // optional labels like "seasonal", "sale", "fast-moving"
  },
  { 
    timestamps: true 
  }
);

// Compound indexes for optimized queries
StockSchema.index({ orgNo: 1, sku: 1 }, { unique: true }); // Unique SKU per organization
StockSchema.index({ orgNo: 1, status: 1 }); // Organization + status queries
StockSchema.index({ orgNo: 1, category: 1 }); // Organization + category queries
StockSchema.index({ orgNo: 1, quantity: 1, lowStockThreshold: 1 }); // Low stock queries
StockSchema.index({ orgNo: 1, updatedAt: -1 }); // Recent items queries
StockSchema.index({ orgNo: 1, sellingPrice: 1 }); // Price range queries
StockSchema.index({ orgNo: 1, productName: "text", sku: "text", description: "text" }); // Text search

// Sparse index for tags (only indexes documents that have tags)
StockSchema.index({ orgNo: 1, tags: 1 }, { sparse: true });

// Virtual for checking low stock
StockSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

// Virtual for profit calculation
StockSchema.virtual("profitMargin").get(function () {
  return this.sellingPrice - this.purchasePrice;
});

// Virtual for stock value calculation
StockSchema.virtual("stockValue").get(function () {
  return this.quantity * this.purchasePrice;
});

// Pre-save middleware to ensure SKU is uppercase
StockSchema.pre('save', function(next) {
  if (this.sku) {
    this.sku = this.sku.toUpperCase();
  }
  next();
});

// Static method for low stock query
StockSchema.statics.findLowStock = function(orgNo) {
  return this.find({
    orgNo,
    status: 'active',
    $expr: { $lte: ["$quantity", "$lowStockThreshold"] }
  });
};

// Static method for category analytics
StockSchema.statics.getCategoryAnalytics = function(orgNo) {
  return this.aggregate([
    { $match: { orgNo, status: { $ne: 'archived' } } },
    {
      $group: {
        _id: "$category",
        itemCount: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } }
      }
    },
    { $sort: { totalValue: -1 } }
  ]);
};

// Increase the stockCount in warehouse when stock is added
StockSchema.post('save', async function(doc, next) {
  const Warehouse = mongoose.model('Warehouse');
  await Warehouse.findByIdAndUpdate(doc.warehouse, { $inc: { stockCount: doc.quantity } });
  next();
});

// Instance method to check if item needs restock
StockSchema.methods.needsRestock = function() {
  return this.quantity <= this.lowStockThreshold;
};

const StockModal = mongoose.model("Stock", StockSchema);

module.exports = {
   StockModal
};