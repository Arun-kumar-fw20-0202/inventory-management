const mongoose = require('mongoose');

const SmtpSchema = new mongoose.Schema({
    host: {
        type: String,
        required: true,
    },
    port: {
        type: Number,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    smtpname: {
        type: String,
        required: true,
    },
});
const SmtpModel = mongoose.model('smtp', SmtpSchema);
module.exports = {
   SmtpModel,
};