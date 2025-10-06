const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: true
   },
   sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
   },
   description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
   },
   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'category',
      required: true,
      index: true
   },
   unit: {
      type: String,
      enum: ['pcs', 'kg', 'ltr', 'box', 'packet'],
      default: 'pcs'
   },
   status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
   },
   orgNo: {
      type: String,
      required: true,
      index: true
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   }
}, {
   timestamps: true,
   versionKey: false
});

// Compound indexes
// productSchema.index({ orgNo: 1, sku: 1 }, { unique: true });
// productSchema.index({ orgNo: 1, status: 1 });
// productSchema.index({ orgNo: 1, category: 1 });

// Text search index
productSchema.index({ name: 'text', sku: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = {
   Product
};
