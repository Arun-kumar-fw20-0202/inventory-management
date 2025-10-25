const { Permission } = require('../../models/permission/permission-scheema');
const { adminPermission, managerPermission, staffPermission } = require('../../utils/permissions');
const { success, error: sendError, forbidden } = require('../../utils/response')


const CreateOrUpdateUserPermissions = async (req, res) => {
    try{
        const orgNo = req.profile.orgNo;
        const { permissions } = req.body;
        const { userId } = req.params;
        const activeRole = req.profile.activerole;
        const filter = { userId }

        if(activeRole !== 'superadmin'){
            filter.orgNo = orgNo
        }


        let permissionDoc = await Permission.findOne(filter);
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
        const activerole = req.profile.activerole
        const { userId } = req.params;

        const filter = { userId }

        if(activerole !== 'superadmin'){
            filter.orgNo = orgNo
        }

        
        const permissionDoc = await Permission.findOne(filter);

        console.log({orgNo})
        
        // if (!permissionDoc) {
        //     return forbidden(res, 'No permissions found for this user');
        // }
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
            defaultPermissions = adminPermission
        }
        if(activeRole === 'manager'){
            defaultPermissions = managerPermission
        }
        if(activeRole === 'staff'){
            defaultPermissions = staffPermission
        }

        const filter = { userId }

        if(activeRole !== 'superadmin'){
            filter.orgNo = orgNo
        }
        
        let permissionDoc = await Permission.findOne(filter);
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
        const userId = req.profile._id;
        const permissionDoc = await Permission.findOne({ userId });
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