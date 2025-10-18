const mongoose = require('mongoose')
const { Schema } = mongoose

const BulkUploadJobSchema = new Schema({
  orgNo: { type: String, index: true },
  uploader: { type: Schema.Types.ObjectId, ref: 'User' },
  filename: { type: String },
  resourceType: { type: String, default: 'warehouse', index: true },
  total: { type: Number, default: 0 },
  processed: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failCount: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING', index: true },
  // Note: we intentionally do NOT store per-row meta/results/errors here for scalability
}, { timestamps: true })

BulkUploadJobSchema.index({ createdAt: -1 })

module.exports = mongoose.model('BulkUploadJob', BulkUploadJobSchema)
