const mongoose = require('mongoose');

const supplierCustomerSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true
   },
   email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      index: true
   },
   phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
   },
   alternatePhone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
   },
   address: {
      street: {
         type: String,
         required: [true, 'Street address is required'],
         trim: true
      },
      city: {
         type: String,
         required: [true, 'City is required'],
         trim: true,
         index: true
      },
      state: {
         type: String,
         required: [true, 'State is required'],
         trim: true,
         index: true
      },
      zipCode: {
         type: String,
         required: [true, 'Zip code is required'],
         trim: true
      },
      country: {
         type: String,
         required: [true, 'Country is required'],
         trim: true,
         default: 'USA',
         index: true
      }
   },
   type: {
      type: String,
      enum: ['supplier', 'customer', 'both'],
      required: [true, 'Type is required'],
      index: true
   },
   companyName: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
      index: true
   },
   contactPerson: {
      name: {
         type: String,
         trim: true,
         maxlength: [100, 'Contact person name cannot exceed 100 characters']
      },
      designation: {
         type: String,
         trim: true,
         maxlength: [100, 'Designation cannot exceed 100 characters']
      },
      email: {
         type: String,
         lowercase: true,
         trim: true,
         match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      phone: {
         type: String,
         trim: true,
         match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
      }
   },
   taxId: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true
   },
   gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true
   },
   website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
   },
   status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'blacklisted'],
      default: 'active',
      index: true
   },
   category: {
      type: String,
      enum: ['premium', 'standard', 'basic', 'vip'],
      default: 'standard',
      index: true
   },
   
   // Financial Information
   creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'Credit limit cannot be negative']
   },
   currentBalance: {
      type: Number,
      default: 0
   },
   totalPurchases: {
      type: Number,
      default: 0,
      min: [0, 'Total purchases cannot be negative']
   },
   totalSales: {
      type: Number,
      default: 0,
      min: [0, 'Total sales cannot be negative']
   },
   paymentTerms: {
      type: String,
      enum: ['net15', 'net30', 'net45', 'net60', 'immediate', 'custom'],
      default: 'net30'
   },
   paymentMethod: {
      type: String,
      enum: ['cash', 'credit', 'bank_transfer', 'check', 'online'],
      default: 'bank_transfer'
   },
   bankDetails: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountHolderName: String
   },

   // Business Metrics
   rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 3
   },
   
   // Transaction History
   lastTransactionDate: Date,
   lastPurchaseAmount: {
      type: Number,
      default: 0
   },
   lastSaleAmount: {
      type: Number,
      default: 0
   },
   
   // Tags and Notes
   tags: [{
      type: String,
      trim: true,
      lowercase: true
   }],
   notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
   },
   internalNotes: {
      type: String,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
   },

   // System Fields
   orgNo: {
      type: String,
      required: [true, 'Organization number is required'],
      index: true
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
   },
   updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   lastContactedAt: Date,
   
   // Performance Metrics
   metrics: {
      totalOrders: {
         type: Number,
         default: 0
      },
      averageOrderValue: {
         type: Number,
         default: 0
      },
      onTimeDeliveryRate: {
         type: Number,
         default: 100,
         min: [0, 'Rate cannot be negative'],
         max: [100, 'Rate cannot exceed 100']
      }
   }
}, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// ============================
// INDEXES FOR PERFORMANCE
// ============================
supplierCustomerSchema.index({ orgNo: 1, type: 1, status: 1 });
supplierCustomerSchema.index({ orgNo: 1, email: 1 }, { unique: true });
supplierCustomerSchema.index({ orgNo: 1, taxId: 1 }, { sparse: true });
supplierCustomerSchema.index({ orgNo: 1, createdAt: -1 });
supplierCustomerSchema.index({ orgNo: 1, lastTransactionDate: -1 });
supplierCustomerSchema.index({ orgNo: 1, totalPurchases: -1 });
supplierCustomerSchema.index({ orgNo: 1, totalSales: -1 });
supplierCustomerSchema.index({ orgNo: 1, category: 1, status: 1 });
supplierCustomerSchema.index({ orgNo: 1, 'address.city': 1, 'address.state': 1 });

// Text search index
supplierCustomerSchema.index({
   name: 'text',
   companyName: 'text',
   email: 'text',
   'contactPerson.name': 'text',
   notes: 'text'
}, {
   weights: {
      name: 10,
      companyName: 8,
      email: 6,
      'contactPerson.name': 4,
      notes: 1
   }
});

// ============================
// VIRTUAL FIELDS
// ============================
supplierCustomerSchema.virtual('fullAddress').get(function() {
   return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

supplierCustomerSchema.virtual('displayName').get(function() {
   return this.companyName || this.name;
});

supplierCustomerSchema.virtual('creditUtilization').get(function() {
   if (this.creditLimit === 0) return 0;
   return ((Math.abs(this.currentBalance) / this.creditLimit) * 100).toFixed(2);
});

supplierCustomerSchema.virtual('isOverdue').get(function() {
   return this.currentBalance < 0;
});

supplierCustomerSchema.virtual('totalTransactions').get(function() {
   return this.totalPurchases + this.totalSales;
});

// ============================
// STATIC METHODS
// ============================

/**
 * Search suppliers/customers with advanced filtering
 */
supplierCustomerSchema.statics.searchContacts = async function(orgNo, searchTerm, options = {}) {
   const {
      limit = 20,
      type,
      status = 'active',
      category,
      includeInactive = false
   } = options;

   const pipeline = [
      {
         $match: {
            orgNo,
            ...(type && { type }),
            ...(category && { category }),
            ...(!includeInactive && { status: { $ne: 'inactive' } }),
            $text: { $search: searchTerm }
         }
      },
      {
         $addFields: {
            score: { $meta: 'textScore' }
         }
      },
      { $sort: { score: { $meta: 'textScore' }, totalTransactions: -1 } },
      { $limit: limit }
   ];

   return this.aggregate(pipeline);
};

/**
 * Get analytics for suppliers/customers
 */
supplierCustomerSchema.statics.getAnalytics = async function(orgNo, type = null) {
   const matchStage = { orgNo };
   if (type) matchStage.type = type;

   const pipeline = [
      { $match: matchStage },
      {
         $group: {
            _id: null,
            totalContacts: { $sum: 1 },
            activeContacts: {
               $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalPurchases: { $sum: '$totalPurchases' },
            totalSales: { $sum: '$totalSales' },
            averageRating: { $avg: '$rating' }
         }
      }
   ];

   return this.aggregate(pipeline);
};

// ============================
// INSTANCE METHODS
// ============================

/**
 * Update transaction metrics
 */
supplierCustomerSchema.methods.updateTransactionMetrics = function(amount, type = 'purchase') {
   if (type === 'purchase') {
      this.totalPurchases += amount;
      this.lastPurchaseAmount = amount;
   } else {
      this.totalSales += amount;
      this.lastSaleAmount = amount;
   }
   
   this.lastTransactionDate = new Date();
   this.metrics.totalOrders += 1;
   this.metrics.averageOrderValue = (this.totalPurchases + this.totalSales) / this.metrics.totalOrders;
   
   return this.save();
};

module.exports = mongoose.model('SupplierCustomer', supplierCustomerSchema);