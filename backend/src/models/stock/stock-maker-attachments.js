const mongoose = require('mongoose');

const StockAttachmentSchema = new mongoose.Schema({
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: [true, 'Stock reference is required'],
        index: true
    },
    attachments: [{
        attachmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StockAttachment',
            required: [true, 'Attachment ID is required']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
            validate: {
                validator: Number.isInteger,
                message: 'Quantity must be an integer'
            }
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required'],
        index: true
    },
    orgNo: {
        type: String,
        required: [true, 'Organization number is required'],
        trim: true,
        uppercase: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    }
}, { 
    timestamps: true,
    versionKey: false,
    collection: 'stock_attachments'
});

// Compound index for better query performance
StockAttachmentSchema.index({ stockId: 1, orgNo: 1 });
StockAttachmentSchema.index({ createdBy: 1, createdAt: -1 });

const StockMakerAttachmentModel = mongoose.model('StockMakerAttachment', StockAttachmentSchema);
module.exports = {
    StockMakerAttachmentModel
}