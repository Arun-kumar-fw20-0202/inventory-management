'use strict'
const mongoose = require('mongoose')
const { UserModal, OrganizationModal } = require('../../models/User')
const { success, error: sendError, forbidden } = require('../../utils/response')
const { generateOrgNo } = require('../../utils/generate-orgNo')


// validate how many users of each role can be created based on the organisation plan
// returns an object { allowed: boolean, message?: string }
const canCreateMore = async (orgNo, role) => {
  try {
    const org = await OrganizationModal.findOne({ orgNo }).lean()
    if (!org) return { allowed: false, message: 'Organisation not found' }

    const counts = org.counts || { users: 0, managers: 0, staff: 0 }
    const planDetails = org?.payment?.details || {}

    // Treat undefined limits as unlimited (Infinity)
    const planLimits = {
      users: typeof planDetails.users === 'number' ? planDetails.users : Infinity,
      managers: typeof planDetails.managers === 'number' ? planDetails.managers : Infinity,
      staff: typeof planDetails.staff === 'number' ? planDetails.staff : Infinity,
    }

    // For admin (counts.users covers admin + other users)
    if (role === 'admin') {
      if (counts.users >= planLimits.users) {
        return { allowed: false, message: `User limit reached. Your current plan allows a maximum of ${planLimits.users} user(s). Please upgrade your plan to add more users.` }
      }
    }

    // For manager: check both manager slot and total users
    if (role === 'manager') {
      if (counts.managers >= planLimits.managers) {
        return { allowed: false, message: `Manager limit reached. Your current plan allows a maximum of ${planLimits.managers} manager(s). Please upgrade your plan to add more managers.` }
      }
      if (counts.users >= planLimits.users) {
        return { allowed: false, message: `User limit reached. Your current plan allows a maximum of ${planLimits.users} user(s). Please upgrade your plan to add more users.` }
      }
    }

    // For staff: check staff slot and total users
    if (role === 'staff') {
      if (counts.staff >= planLimits.staff) {
        return { allowed: false, message: `Staff limit reached. Your current plan allows a maximum of ${planLimits.staff} staff member(s). Please upgrade your plan to add more staff.` }
      }
      if (counts.users >= planLimits.users) {
        return { allowed: false, message: `User limit reached. Your current plan allows a maximum of ${planLimits.users} user(s). Please upgrade your plan to add more users.` }
      }
    }

    return { allowed: true }
  } catch (err) {
    console.error('canCreateMore error:', err)
    return { allowed: false, message: 'Could not validate plan limits' }
  }
}


/**
 * ==========================
 * USER CONTROLLER (Production-Ready)
 * Multi-company | Role-aware | Fully Optimized
 * ==========================
 */

// 🧩 CREATE USER
const createUser = async (req, res) => {
  let session = null
  try {
    const creator = req.profile
    const { name, email, phone, password, role, owner, orgNo: bodyOrgNo } = req.body || {}

    if (!name || !email || !phone || !password || !role) {
      return sendError(res, 'Missing required fields: name, email, phone, password, role')
    }

    const normalizedRole = String(role).toLowerCase()
    const allowedRoles = ['superadmin', 'admin', 'manager', 'staff']
    if (!allowedRoles.includes(normalizedRole)) return sendError(res, 'Invalid role')

    const creatorRole = creator?.activerole || 'superadmin'

    // ✅ Role creation logic
    const canCreate = (() => {
      if (creatorRole === 'superadmin') return true
      if (creatorRole === 'admin') return ['manager', 'staff'].includes(normalizedRole)
      if (creatorRole === 'manager') return normalizedRole === 'staff'
      return false
    })()

    if (!canCreate) return forbidden(res, 'Not authorized to create this role')

    // ✅ Determine orgNo
    let orgNo = null
    if (creatorRole === 'admin' || creatorRole === 'manager') {
      orgNo = creator.orgNo
    }

    let createdOrganization = null
    if (normalizedRole === 'admin') {
      if (creatorRole !== 'superadmin') return forbidden(res, 'Only superadmin can create admin users')

      orgNo = bodyOrgNo || await generateOrgNo()

      // Prevent duplicate admins for same org
      const existingAdmin = await UserModal.exists({ orgNo, activerole: 'admin' })
      if (existingAdmin) return sendError(res, `An admin already exists for orgNo ${orgNo}`)

  // Start transaction
      session = await mongoose.startSession()
      session.startTransaction()

      createdOrganization = new OrganizationModal({
        name: `${name.trim()} Organization`,
        orgNo,
        userId: null,
        counts: { users: 0, managers: 0, staff: 0 }
      })
      // counts will be adjusted after creating the admin user (inside the transaction)
      await createdOrganization.save({ session })
    }

    // BEFORE creating a non-superadmin user, validate plan limits for the org
    // If creating an admin for a newly created org, the createdOrganization already holds counts (initially 0)
    if (normalizedRole !== 'admin') {
      const targetOrgNo = orgNo || creator.orgNo
      if (targetOrgNo) {
        const limitCheck = await canCreateMore(targetOrgNo, normalizedRole)
        if (!limitCheck.allowed) {
          if (session) {
            try { await session.abortTransaction() } catch (e) {}
            try { session.endSession() } catch (e) {}
          }
          return sendError(res, limitCheck.message || 'Plan limits prevent creating this user')
        }
      }
    }

    // ✅ Global unique email/phone
    const existing = await UserModal.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] }).lean()
    if (existing) {
      if (session) await session.abortTransaction()
      if (session) session.endSession()
      return sendError(res, 'A user with that email or phone already exists')
    }

    const userObj = {
      name,
      email: String(email).toLowerCase(),
      phone,
      password,
      activerole: normalizedRole,
      role: [normalizedRole],
      orgNo: orgNo || null,
      owner: !!owner,
      createdBy: creator?._id || null,
    }

  let user
    if (createdOrganization) {
      // create user inside transaction
      // For admin creation within a transaction, also verify limits on the new org (defensive)
      const limitCheckForAdmin = await canCreateMore(createdOrganization.orgNo, 'admin')
      if (!limitCheckForAdmin.allowed) {
        try { await session.abortTransaction() } catch (e) {}
        try { session.endSession() } catch (e) {}
        return sendError(res, limitCheckForAdmin.message || 'Plan limits prevent creating admin for this organisation')
      }

      user = await UserModal.create([userObj], { session })
      user = user[0]

      // link and update counts in the same transaction
      createdOrganization.userId = user._id
      // admin counts as a user for the organisation
      createdOrganization.counts = createdOrganization.counts || { users: 0, managers: 0, staff: 0 }
      createdOrganization.counts.users = (createdOrganization.counts.users || 0) + 1

  await createdOrganization.save({ session })

      await session.commitTransaction()
      session.endSession()
    } else {
      user = await UserModal.create(userObj)

      // Update organisation counts atomically for existing orgs
      try {
        if (user.orgNo) {
          const inc = {}
          if (normalizedRole === 'admin') inc['counts.users'] = 1
          else if (normalizedRole === 'manager') inc['counts.managers'] = 1
          else if (normalizedRole === 'staff') inc['counts.staff'] = 1

          if (Object.keys(inc).length > 0) {
            await OrganizationModal.findOneAndUpdate({ orgNo: user.orgNo }, { $inc: inc })
          }
        }
      } catch (e) {
        console.error('Failed updating organisation counts:', e)
      }
    }

    const userSafe = user.toObject()
    delete userSafe.password

    return success(res, 'User created successfully', { user: userSafe })
  } catch (err) {
    console.error('createUser error:', err)
    if (session) {
      try { await session.abortTransaction() } catch {}
      try { session.endSession() } catch {}
    }
    if (err && err.code === 11000) {
      const fields = Object.keys(err.keyValue || {}).join(', ')
      return sendError(res, `Duplicate value for fields: ${fields}`)
    }
    return sendError(res, 'Could not create user', err)
  }
}

// 🧭 FETCH USERS (Full filtering + pagination + optimized)
const fetchUsers = async (req, res) => {
  try {
    const requester = req.profile
    const { 
      page = 1, 
      limit = 20, 
      q, 
      role, 
      block_status, 
      startDate, 
      endDate, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query || {}

    const filters = {
    }
    filters._id = { $ne: requester._id } 
    if (q) {
      filters.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
      ]
    }

    if (role) filters.activerole = role
    if (block_status !== undefined) filters.block_status = block_status === 'true'


    if (startDate || endDate) {
      filters.createdAt = {}
      if (startDate) filters.createdAt.$gte = new Date(startDate)
      if (endDate) filters.createdAt.$lte = new Date(endDate)
    }

    // restrict non-superadmins to their org
    // if (requester?.activerole !== 'superadmin') {
    //   filters.orgNo = requester.orgNo
    // } else if (req.query.orgNo) {
    //   filters.orgNo = req.query.orgNo
    // }

    if(requester?.activerole === 'superadmin') {
      filters.activerole = 'admin' // superadmin can only see admin users
    }
    else if(requester?.activerole === 'admin') {
      filters.orgNo = requester.orgNo
    }
    else {
      filters.createdBy = requester?._id 
    }

    const skip = (Number(page) - 1) * Number(limit)
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    // Parallel query execution for performance
    const [users, total] = await Promise.all([
      UserModal.find(filters)
        .populate('createdBy', 'name email')
        .lean()
        .select('-password -updatedAt -__v')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      UserModal.countDocuments(filters),
    ])


    return success(res, 'Users fetched successfully', {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      users: users,
      isNextPage: skip + users.length < total,
      isPrevPage: page > 1,
    })
  } catch (err) {
    console.error('fetchUsers error:', err)
    return sendError(res, 'Could not fetch users', err)
  }
}

// 🧱 GET SINGLE USER
const getUserById = async (req, res) => {
  try {
    const requester = req.profile
    const { id } = req.params
    const user = await UserModal.findById(id)
      .populate('createdBy', 'name email')
      .select('-password -updatedAt -__v -referredBy_count')
      .lean()

    if (!user) return sendError(res, 'User not found')
    if (requester?.activerole !== 'superadmin' && user.orgNo !== requester.orgNo) {
      return forbidden(res, 'Not authorized to view this user')
    }

    let additionalData = {};
    
    if(requester?.activerole === 'superadmin'){
      const [managerCount, staffCount] = await Promise.all([
        UserModal.find({orgNo: user?.orgNo, activerole: 'manager' }).select('-password -updatedAt -__v -referredBy_count'),
        UserModal.find({orgNo: user?.orgNo, activerole: 'staff' }).select('-password -updatedAt -__v -referredBy_count'),
      ]);
      
      additionalData = {
        manager_list: managerCount,
        staff_list: staffCount
      };
    }

    return success(res, 'User fetched successfully', {
      data: user,
      ...additionalData
    })
  } catch (err) {
    console.error('getUserById error:', err)
    return sendError(res, 'Could not fetch user', err)
  }
}

// ⚙️ UPDATE USER (Safe and role-aware)
const updateUser = async (req, res) => {
  try {
    const requester = req.profile
    const { id } = req.params
    const update = { ...req.body }

    // non-superadmin cannot change protected fields
    if (requester?.activerole !== 'superadmin') {
      delete update.activerole
      delete update.orgNo
    }

    // only admin/superadmin can block/unblock
    if (update.block_status !== undefined && !['admin', 'superadmin'].includes(requester?.activerole)) {
      delete update.block_status
    }

    // role upgrade to admin is restricted
    if (update.activerole === 'admin' && requester?.activerole !== 'superadmin') {
      return forbidden(res, 'Only superadmin can promote to admin')
    }

    const user = await UserModal.findByIdAndUpdate(id, update, { new: true }).lean()
    if (!user) return sendError(res, 'User not found')

    delete user.password
    return success(res, 'User updated successfully', { user })
  } catch (err) {
    console.error('updateUser error:', err)
    return sendError(res, 'Could not update user', err)
  }
}

// 🗑 DELETE USER (Soft / Hard)
const deleteUser = async (req, res) => {
  try {
    const requester = req.profile
    const { id } = req.params
    const hard = req.query.hard === 'true'

    if (hard && requester?.activerole !== 'superadmin') return forbidden(res, 'Not authorized')

    if (hard) {
        // find user to adjust counts
        const userToDelete = await UserModal.findById(id).lean()
        if (!userToDelete) return sendError(res, 'User not found')

        // perform delete
        await UserModal.findByIdAndDelete(id)

        // decrement organisation counts if orgNo exists
        try {
          if (userToDelete.orgNo) {
            const inc = {}
            if (userToDelete.activerole === 'admin') inc['counts.users'] = -1
            else if (userToDelete.activerole === 'manager') inc['counts.managers'] = -1
            else if (userToDelete.activerole === 'staff') inc['counts.staff'] = -1

            if (Object.keys(inc).length > 0) {
              await OrganizationModal.findOneAndUpdate(
                { orgNo: userToDelete.orgNo },
                { $inc: inc },
              )
            }
          }
        } catch (e) {
          console.error('Failed decrementing organisation counts on delete:', e)
        }

        return success(res, 'User permanently deleted')
    }

      // soft block: mark as blocked and decrement counts once
      const user = await UserModal.findById(id)
      if (!user) return sendError(res, 'User not found')

      if (!user.block_status) {
        // was active -> decrement counts
        try {
          if (user.orgNo) {
            const inc = {}
            if (user.activerole === 'admin') inc['counts.users'] = -1
            else if (user.activerole === 'manager') inc['counts.managers'] = -1
            else if (user.activerole === 'staff') inc['counts.staff'] = -1

            if (Object.keys(inc).length > 0) {
              await OrganizationModal.findOneAndUpdate({ orgNo: user.orgNo }, { $inc: inc })
            }
          }
        } catch (e) {
          console.error('Failed decrementing organisation counts on block:', e)
        }
      }

      user.block_status = true
      await user.save()
      const userSafe = user.toObject()
      delete userSafe.password

      return success(res, 'User blocked successfully', { user: userSafe })
  } catch (err) {
    console.error('deleteUser error:', err)
    return sendError(res, 'Could not delete user', err)
  }
}

module.exports = {
  createUser,
  fetchUsers,
  getUserById,
  updateUser,
  deleteUser,
}
