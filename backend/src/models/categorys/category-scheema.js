const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
   },
   description: {
      type: String,
   },
   orgNo: {
      type: String,
      required: true,
   },
   active_status: {
      type: Boolean,
      default: true,
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   }
   
}, {timestamps: true, versionKey: false  });

const CategoryModel = mongoose.model('category', productCategorySchema);
module.exports = {
   CategoryModel
};