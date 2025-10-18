const { Permission } = require('../../models/permission/permission-scheema')
const { success, error: sendError, forbidden } = require('../../utils/response')


const CreateOrUpdateUserPermissions = async (req, res) => {
    try{
        const orgNo = req.profile.orgNo;
        const { permissions } = req.body;
        const { userId } = req.params;

        let permissionDoc = await Permission.findOne({ userId, orgNo });
        if (permissionDoc) {
            // Update existing permissions
            permissionDoc.permissions = permissions;
            permissionDoc.updatedBy = req.profile._id;
            await permissionDoc.save();
            return success(res, 'Permissions updated successfully', permissionDoc);
        } else {
            // Create new permissions
            const newPermission = new Permission({
                userId,
                orgNo,
                permissions,
                createdBy: req.profile._id
            });
            await newPermission.save();
            return success(res, 'Permissions created successfully', newPermission);
        }
        
    }
    catch(err){
        console.error('CreateOrUpdateUserPermissions error', err)
        return sendError(res, 'Internal server error', 500)
    }
}

const GetUserPermissions = async (req, res) => {
    try{
        const orgNo = req.profile.orgNo;
        const { userId } = req.params;
        const permissionDoc = await Permission.findOne({ userId, orgNo });
        if (!permissionDoc) {
            return forbidden(res, 'No permissions found for this user');
        }
        return success(res, 'Permissions fetched successfully', permissionDoc);
    }
    catch(err){
        console.error('GetUserPermissions error', err)
        return sendError(res, 'Internal server error', 500)
    }
}

const ResetDefaultPermissions = async (req, res) => {
    try{
        const orgNo = req.profile.orgNo;
        const { userId } = req.params;
        const activeRole = req.profile.activeRole;
        // it will reset the permision base on the role
        let defaultPermissions = {};
        if(activeRole === 'admin'){
            defaultPermissions = {
                systemuser: { create: true, read: true, update: true, delete: true },
                stock: { create: true, read: true, update: true, delete: true },
                sales: { create: true, read: true, update: true, delete: true },
                purchases: { create: true, read: true, update: true, delete: true },
                reports: { create: false, read: true, update: false, delete: false },
                organization: { create: false, read: true, update: true, delete: false },
                sessions: { create: false, read: true, update: false, delete: false },
            }
        }
        if(activeRole === 'manager'){
            defaultPermissions = {
                systemuser: { create: true, read: true, update: true, delete: true },
                stock: { create: true, read: true, update: true, delete: false },
                sales: { create: true, read: true, update: true, delete: false },
                purchases: { create: true, read: true, update: true, delete: false },
                reports: { create: false, read: true, update: false, delete: false },
                organization: { create: false, read: true, update: false, delete: false },
                sessions: { create: false, read: true, update: false, delete: false },
            }
        }
        if(activeRole === 'staff'){
            defaultPermissions = {
                systemuser: { create: false, read: false, update: false, delete: false },
                stock: { create: false, read: true, update: false, delete: false },
                sales: { create: true, read: true, update: false, delete: false },
                purchases: { create: true, read: true, update: false, delete: false },
                reports: { create: false, read: false, update: false, delete: false },
                organization: { create: false, read: false, update: false, delete: false },
                sessions: { create: false, read: true, update: false, delete: false },
            }
        }
        let permissionDoc = await Permission.findOne({ userId, orgNo });
        if (permissionDoc) {
            // Update existing permissions
            permissionDoc.permissions = defaultPermissions;
            permissionDoc.updatedBy = req.profile._id;
            await permissionDoc.save();
            return success(res, 'Permissions reset to default successfully', permissionDoc);
        }
        else {
            // Create new permissions
            const newPermission = new Permission({
                userId,
                orgNo,
                permissions: defaultPermissions,
                createdBy: req.profile._id
            });
            await newPermission.save();
            return success(res, 'Default permissions created successfully', newPermission);
        }
    }
    catch(err){
        console.error('ResetDefaultPermissions error', err)
        return sendError(res, 'Internal server error', 500)
    }
}


const FetchMyPermissions = async (req, res) => {
    try{
        const orgNo = req.profile.orgNo;
        const userId = req.profile._id;
        const permissionDoc = await Permission.findOne({ userId, orgNo });
        if (!permissionDoc) {
            return forbidden(res, 'No permissions found for this user');
        }
        return success(res, 'Permissions fetched successfully', permissionDoc);
    }
    catch(err){
        console.error('FetchMyPermissions error', err)
        return sendError(res, 'Internal server error', 500)
    }
}

module.exports = {
    CreateOrUpdateUserPermissions,
    GetUserPermissions,
    ResetDefaultPermissions,
    FetchMyPermissions

}