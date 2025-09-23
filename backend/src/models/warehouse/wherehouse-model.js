
const mongoose = require('mongoose');


const wherehouseSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
   },
   branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
   },
   location: {
      type: String,
      required: true,
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

const WherehouseModel = mongoose.model('Warehouse', wherehouseSchema);

module.exports = {
   WherehouseModel
}