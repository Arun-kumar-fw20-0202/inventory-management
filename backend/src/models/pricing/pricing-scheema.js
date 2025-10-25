const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    //   unique: true,
      trim: true,
    //   enum: ['Basic', 'Standard', 'Enterprise'], // can be extended dynamically
    },

    description: {
      type: String,
      trim: true,
    },

    limits: {
      managers: {
        type: mongoose.Schema.Types.Mixed, // allows number or "unlimited"
        required: true,
        validate: {
          validator: function (v) {
            return typeof v === 'number' && v >= 0 || v === 'unlimited';
          },
          message: 'Manager limit must be a positive number or "unlimited"',
        },
      },
      staff: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
          validator: function (v) {
            return typeof v === 'number' && v >= 0 || v === 'unlimited';
          },
          message: 'Staff limit must be a positive number or "unlimited"',
        },
      },
      production_head: {
        type: mongoose.Schema.Types.Mixed, // allows number or "unlimited"
        required: false,
        validate: {
          validator: function (v) {
            return typeof v === 'number' && v >= 0 || v === 'unlimited';
          },
          message: 'Production Head limit must be a positive number or "unlimited"',
        },
      },
      accountant: {
        type: mongoose.Schema.Types.Mixed, // allows number or "unlimited"
        required: false,
        validate: {
          validator: function (v) {
            return typeof v === 'number' && v >= 0 || v === 'unlimited';
          },
          message: 'Accountant limit must be a positive number or "unlimited"',
        },
      },
    },

    price: {
      type: Number,
      default: 0, // optional: for paid plans
    },

    currency: {
      type: String,
      default: 'INR',
    },

    // new fields requested
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return typeof v === 'number' && v >= 0
        },
        message: 'Discount price must be a non-negative number',
      },
    },

    // legacy popularity flags removed — handled in UI only if needed

    features: {
      type: [String],
      default: [],
    },

    // how many months the membership is valid for
    validityMonths: {
      type: Number,
      default: 1,
      validate: {
        validator: function (v) { return Number.isInteger(v) && v >= 0 },
        message: 'validityMonths must be a non-negative integer',
      }
    },

    trialDays: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) { return Number.isInteger(v) && v >= 0 },
        message: 'trialDays must be a non-negative integer',
      }
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },

    // customizable removed - plans are managed by superadmin via API
    billing_cycle: {
      type: [String],
      enum: ['monthly', 'yearly'],
      default: ['monthly', 'yearly'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

const PlanModel = mongoose.model('Plan', PlanSchema);
module.exports = {
  PlanModel
};