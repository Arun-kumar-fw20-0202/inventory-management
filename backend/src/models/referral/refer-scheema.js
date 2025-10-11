const mongoose = require('mongoose');

const RefferalSchema = new mongoose.Schema({
   code: {
      type: String,
      required: true,
   },
   refferBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   },
   refferTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   },
}, { timestamps: true , versionKey: false });

const RefferalModel = mongoose.model('referral-history', RefferalSchema);

// Add this line to properly export as an object
module.exports = { RefferalModel };