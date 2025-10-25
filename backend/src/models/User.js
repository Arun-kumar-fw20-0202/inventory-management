const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: [String],
      default: 'staff',
      enum: ["superadmin", "admin", "manager", "staff", 'production_head', 'accountant'], // Roles within the platform
    },
    activerole: {
      type: String,
      default: 'staff',
      enum: ["superadmin", "admin", "manager", "staff"], // Roles within the platform
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    orgNo: {
      type: String,
      trim: true,
    },
    owner: {
      type: Boolean,
      default: false, // Flag to identify the owner of the organization
    },
    block_status: {
      type: Boolean,
      default: false, // Flag to identify if the user is active
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the user who created this user
    },
    payment : {
      lastPricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'pricing', },
      pricing_type: { type: String },
      amount: { type: String },
      paymentDate : { type: Date },
      willExpire: { type: Date },
      lastPaymentId: { type: String }
    },
    referredBy_count: {
      type: Number,
      default: 0 // Count of successful referrals made by this user
    },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The referral code of the user who referred this user
    referralCode: { type: String, unique: true, sparse: true }, // Unique referral code for each user
    whatsapp_cred: { type: Number } ,
    shop_name: { type: String },
    // Forgot password token (store hashed token) and expiration
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    last_login: {
      type: Date,
    }
  }, { timestamps: true });

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔹 Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Organization Schema
const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  payment : {
    lastPricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'pricing', },
    pricing_type: { type: String },
    amount: { type: String },
    paymentDate : { type: Date },
    willExpire: { type: Date },
    details: { 
      limits: { type: Object },
      amount: { type: Number },
      name: { type: String },
      durationInMonths: { type: Number },
      isTrial: { type: Boolean, default: false },
    },
    lastPaymentId: { type: String }
  },
  orgNo: {
    type: String, 
    required: true,
    unique: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
  },
  counts : {
    users: { type: Number, default: 0 },
    managers: { type: Number, default: 0 },
    staff: { type: Number, default: 0 },
  },
  details: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    taxId: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    logoUrl: { type: String, default: '' },
    businessType: { type: String, default: '' },
    industry: { type: String, default: '' },
    additionalInfo: { type: String, default: '' },
  }
}, { timestamps: true });


const UserModal = mongoose.model("User", userSchema);
const OrganizationModal = mongoose.model("Organization", OrganizationSchema);


module.exports = {
  UserModal,
  OrganizationModal,
};