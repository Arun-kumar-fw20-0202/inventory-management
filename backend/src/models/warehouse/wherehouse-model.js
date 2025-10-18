
const mongoose = require('mongoose');


const wherehouseSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
   },
   // branchId: {
   //    type: mongoose.Schema.Types.ObjectId,
   //    ref: 'Branch',
   // },
   location: {
      type: String,
      required: true,
   },
   description: {
      type: String,
   },
   active_status: {
      type: Boolean,
      default: true,
   },
   orgNo: {
      type: String,
      required: true,
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   }
   
}, {timestamps: true, versionKey: false  });

// ensure unique warehouse per org by name
wherehouseSchema.index({ name: 1, orgNo: 1 }, { unique: true, background: true });

const WherehouseModel = mongoose.model('Warehouse', wherehouseSchema);

module.exports = {
   WherehouseModel
}