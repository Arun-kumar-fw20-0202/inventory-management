const mongoose = require('mongoose');

const StockAttachmentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
        index: true
    },
    description: { 
        type: String, 
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: [true, 'Creator is required'],
        index: true
    },
    qty: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number'
        }
    },
    orgNo: {
        type: String,
        required: [true, 'Organization number is required'],
        trim: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued'],
        default: 'active',
        index: true
    }
}, { 
    timestamps: true,
    versionKey: false,
});

// Compound indexes for better query performance
StockAttachmentSchema.index({ orgNo: 1, status: 1 });
StockAttachmentSchema.index({ createdBy: 1, createdAt: -1 });

// Pre-save middleware for additional validation
StockAttachmentSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.name = this.name.replace(/\s+/g, ' '); // normalize whitespace
    }
    next();
});

const StockAttachmentModel = mongoose.model('StockAttachment', StockAttachmentSchema);

module.exports = {
    StockAttachmentModel
};