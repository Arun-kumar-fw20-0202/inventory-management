const mongoose = require('mongoose');

// Define reusable CRUD permissions object
const CRUDPermissions = {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
};

const PermissionModuleSchema = new mongoose.Schema({
    systemuser: CRUDPermissions,
    stock: CRUDPermissions,
    sales: {...CRUDPermissions, approve: { type: Boolean, default: false }, reject: { type: Boolean, default: false }, complete: { type: Boolean, default: false  }},
    purchases: {...CRUDPermissions , approve: { type: Boolean, default: false }, reject: { type: Boolean, default: false }, complete: { type: Boolean, default: false } },
    reports: CRUDPermissions,
    organization: CRUDPermissions,
    sessions: CRUDPermissions,
    pricing: CRUDPermissions,
    settings: CRUDPermissions,
    
    category: CRUDPermissions,
    warehouse: CRUDPermissions,
    supplier: CRUDPermissions,
    customer: CRUDPermissions,

}, { _id: false });

const PermissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    orgNo: {
        type: String,
        required: false,
    },
    permissions: {
        type: PermissionModuleSchema,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true,
    versionKey: false
});

// Create the model
const Permission = mongoose.model('Permission', PermissionSchema);

module.exports = {
    Permission,
    PermissionSchema
};
