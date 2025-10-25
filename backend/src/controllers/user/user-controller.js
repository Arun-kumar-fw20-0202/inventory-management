'use strict'
const mongoose = require('mongoose')
const { UserModal, OrganizationModal } = require('../../models/User')
const { Permission } = require('../../models/permission/permission-scheema')
const { success, error: sendError, forbidden } = require('../../utils/response')
const { generateOrgNo } = require('../../utils/generate-orgNo')
const { adminPermission, managerPermission, staffPermission } = require('../../utils/permissions')


// validate how many users of each role can be created based on the organisation plan
// returns an object { allowed: boolean, message?: string }
// ──────────────────────────────────────────────────────────────
//  Imports & Helpers (Assumed to be already defined elsewhere)
// ──────────────────────────────────────────────────────────────
// const { OrganizationModal, UserModal, Permission } = require('../models')
// const { sendError, success, forbidden } = require('../utils/response')
// const { generateOrgNo } = require('../utils/org')
// const { adminPermission, managerPermission, staffPermission } = require('../permissions')

// ──────────────────────────────────────────────────────────────
//  Helper: Check if a user can be created based on plan limits
// ──────────────────────────────────────────────────────────────
const canCreateMore = async (orgNo, role) => {
  try {
    if (!orgNo) return { allowed: false, message: 'Organization number required' }

    // Find or create org if missing
    let org = await OrganizationModal.findOne({ orgNo }).lean()
    if (!org) {
      const newOrgNo = orgNo || await generateOrgNo()
      org = await OrganizationModal.findOneAndUpdate(
        { orgNo: newOrgNo },
        {
          $setOnInsert: {
            name: `Org ${newOrgNo}`,
            orgNo: newOrgNo,
            counts: { 
              users: 0, 
              managers: 0, 
              staff: 0,
              production_head: 0,
              accountant: 0,
            },
          },
        },
        { new: true, upsert: true }
      ).lean()
    }

    if (!org) return { allowed: false, message: 'Organization not found' }

    const counts = org.counts || { users: 0, managers: 0, staff: 0, production_head: 0, accountant: 0 }
    const limits = org?.payment?.details?.limits || {}

    // Treat undefined limits as Infinity (unlimited)
    const planLimits = {
      users: Number.isFinite(limits.users) ? limits.users : Infinity,
      managers: Number.isFinite(limits.managers) ? limits.managers : Infinity,
      staff: Number.isFinite(limits.staff) ? limits.staff : Infinity,
      production_head: Number.isFinite(limits.production_head) ? limits.production_head : Infinity,
      accountant: Number.isFinite(limits.accountant) ? limits.accountant : Infinity,
    }

    // Validation logic per role
    const roleChecks = {
      admin: () =>
        counts.users < planLimits.users || {
          allowed: false,
          message: `User limit reached. Upgrade your plan to add more users (max ${planLimits.users}).`,
        },

      manager: () =>
        (counts.managers < planLimits.managers && counts.users < planLimits.users) || {
          allowed: false,
          message:
            counts.managers >= planLimits.managers
              ? `Manager limit reached. Max ${planLimits.managers} allowed.`
              : `User limit reached. Max ${planLimits.users} allowed.`,
        },

      staff: () =>
        (counts.staff < planLimits.staff && counts.users < planLimits.users) || {
          allowed: false,
          message:
            counts.staff >= planLimits.staff
              ? `Staff limit reached. Max ${planLimits.staff} allowed.`
              : `User limit reached. Max ${planLimits.users} allowed.`,
        },

      production_head: () =>
        (counts.production_head < planLimits.production_head && counts.users < planLimits.users) || {
          allowed: false,
          message:
            counts.production_head >= planLimits.production_head
              ? `Production head limit reached. Max ${planLimits.production_head} allowed.`
              : `User limit reached. Max ${planLimits.users} allowed.`,
        },

      accountant: () =>
        (counts.accountant < planLimits.accountant && counts.users < planLimits.users) || {
          allowed: false,
          message:
            counts.accountant >= planLimits.accountant
              ? `Accountant limit reached. Max ${planLimits.accountant} allowed.`
              : `User limit reached. Max ${planLimits.users} allowed.`,
        },
    }

    const result = roleChecks[role]?.()
    if (result === true || result?.allowed !== false) return { allowed: true }
    return result
  } catch (err) {
    console.error('canCreateMore error:', err)
    return { allowed: false, message: 'Could not validate plan limits' }
  }
}

// ──────────────────────────────────────────────────────────────
//  Controller: Create User
// ──────────────────────────────────────────────────────────────
const createUser = async (req, res) => {
  let session = null

  try {
    const creator = req.profile
    const { name, email, phone, password, role, owner } = req.body || {}

    // ─── Validate input ─────────────────────────────
    if (!name || !email || !phone || !password || !role)
      return sendError(res, 'Missing required fields: name, email, phone, password, role')

    const normalizedRole = role.toLowerCase()
    const validRoles = ['superadmin', 'admin', 'manager', 'staff']
    if (!validRoles.includes(normalizedRole))
      return sendError(res, 'Invalid role')

    const creatorRole = creator?.activerole || 'superadmin'

    // ─── Role creation permissions ─────────────────
    const canCreateRole = {
      superadmin: ['admin', 'manager', 'staff'],
      admin: ['manager', 'staff'],
      manager: ['staff'],
    }

    if (!canCreateRole[creatorRole]?.includes(normalizedRole) && creatorRole !== 'superadmin')
      return forbidden(res, 'Not authorized to create this role')

    // ─── Determine orgNo ───────────────────────────
    let orgNo = creatorRole === 'superadmin' ? await generateOrgNo() : creator.orgNo
    let user = null
    let createdOrg = null

    // ─── If creating admin ─────────────────────────
    if (normalizedRole === 'admin') {
      if (creatorRole !== 'superadmin')
        return forbidden(res, 'Only superadmin can create admin users')

      orgNo = await generateOrgNo()

      const adminExists = await UserModal.exists({ orgNo, activerole: 'admin' })
      if (adminExists)
        return sendError(res, `An admin already exists for orgNo ${orgNo}`)

      // Create org if missing
      createdOrg = await OrganizationModal.findOneAndUpdate(
        { orgNo },
        {
          $setOnInsert: {
            name: `${name.trim()} Organization`,
            orgNo,
            counts: { users: 0, managers: 0, staff: 0 },
          },
        },
        { new: true, upsert: true }
      ).lean()

      // Create admin user
      user = await UserModal.create({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        activerole: normalizedRole,
        role: [normalizedRole],
        orgNo,
        owner: !!owner,
        createdBy: creator?._id || null,
      })

      // Link org to user and initialize counts for new role fields
      await OrganizationModal.findOneAndUpdate(
        { orgNo },
        { $set: { userId: user._id }, $inc: { 'counts.users': 1 } }
      );

      // Seed default permissions asynchronously (upsert to ensure document exists)
      ;(async () => {
        try {
          // pick template if available, otherwise fall back to staffPermission
          const templateMap = {
            admin: adminPermission,
            manager: managerPermission,
            staff: staffPermission,
            production_head: staffPermission,
            accountant: staffPermission,
          }
          const template = templateMap[normalizedRole] || staffPermission

          await Permission.findOneAndUpdate(
            { userId: user._id },
            {
              $set: { permissions: template, orgNo },
              $setOnInsert: { userId: user._id, createdBy: creator?._id || user._id },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        } catch (err) {
          console.error('Failed to seed default permissions (admin path):', err)
        }
      })()
    }

    // ─── For manager/staff ─────────────────────────
    if (normalizedRole !== 'admin') {
      const targetOrgNo = orgNo || creator.orgNo
      const limitCheck = await canCreateMore(targetOrgNo, normalizedRole)
      if (!limitCheck.allowed)
        return sendError(res, limitCheck.message)
    }

    // ─── Unique email / phone check ────────────────
    if (!user) {
      const existingUser = await UserModal.findOne({
        $or: [{ email: email.toLowerCase() }, { phone }],
      }).lean()

      if (existingUser)
        return sendError(res, 'A user with that email or phone already exists')
    }

    // ─── Create non-admin users ────────────────────
    if (!user) {
      user = await UserModal.create({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        activerole: normalizedRole,
        role: [normalizedRole],
        orgNo: orgNo || null,
        owner: !!owner,
        createdBy: creator?._id || null,
      })
      // Seed default permissions asynchronously (upsert so updates on re-run are safe)
      ;(async () => {
        try {
          // seed default permission template for new user (fall back to staffPermission)
          const templateMap = {
            admin: adminPermission,
            manager: managerPermission,
            staff: staffPermission,
            production_head: staffPermission,
            accountant: staffPermission,
          }
          const tpl = templateMap[user?.activerole] || staffPermission

          try {
            await Permission.create({ permissions: tpl, userId: user?._id, orgNo: user?.orgNo, createdBy: req?.profile?._id })
          } catch (permErr) {
            console.error('Failed to seed default permissions (non-admin path):', permErr)
          }
        } catch (err) {
          console.error('Failed to seed default permissions (non-admin path):', err)
        }
      })()

      // Increment org counts
      const incMap = {
        admin: { 'counts.users': 1 },
        manager: { 'counts.managers': 1 },
        staff: { 'counts.staff': 1 },
        production_head: { 'counts.production_head': 1 },
        accountant: { 'counts.accountant': 1 },
      }

      if (user.orgNo && incMap[normalizedRole]) {
        await OrganizationModal.findOneAndUpdate(
          { orgNo: user.orgNo },
          { $inc: incMap[normalizedRole] }
        )
      }
    }

    // ─── Prepare and return response ───────────────
    const userSafe = user.toObject ? user.toObject() : user
    delete userSafe.password

    return success(res, 'User created successfully', { user: userSafe })
  } catch (err) {
    console.error('createUser error:', err)
    if (session) {
      try { await session.abortTransaction() } catch {}
      try { session.endSession() } catch {}
    }

    if (err?.code === 11000) {
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
      sortOrder = 'desc',
      fields // new field parameter
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

    // Build select string based on fields parameter
    let selectFields = '-password -updatedAt -__v'
    if (fields) {
      // Convert comma-separated fields to space-separated for MongoDB select
      const requestedFields = fields.split(',').map(field => field.trim()).join(' ')
      selectFields = requestedFields
    }

    // Parallel query execution for performance
    const [users, total] = await Promise.all([
      UserModal.find(filters)
        .populate('createdBy', 'name email')
        .lean()
        .select(selectFields)
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

    // Load existing user to reason about changes (role/org/block transitions)
    const existingUser = await UserModal.findById(id).lean()
    if (!existingUser) return sendError(res, 'User not found')

    // non-superadmin cannot change protected fields
    if (requester?.activerole !== 'superadmin') {
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

    // Validation: If role is changing, moving org, or user is being unblocked -> ensure target org has capacity
    // 1) Role change
    const validationNewRole = update.activerole || existingUser.activerole
    const orgAfter = req.profile.orgNo
    if (validationNewRole && validationNewRole !== existingUser.activerole) {
      if (orgAfter) {
        const limitCheck = await canCreateMore(orgAfter, validationNewRole)
        if (!limitCheck.allowed) return sendError(res, limitCheck.message || 'Plan limits prevent changing role')
      }
    }

    // 2) Moving user to another org (role remains same)
    if (update.orgNo && update.orgNo !== existingUser.orgNo) {
      if (existingUser.activerole) {
        const limitCheck = await canCreateMore(update.orgNo, existingUser.activerole)
        if (!limitCheck.allowed) return sendError(res, limitCheck.message || 'Plan limits prevent moving user to the target organisation')
      }
    }

    // 3) Unblocking user (reactivating) - ensure org has capacity
    if (update.block_status === false && existingUser.block_status === true) {
      const targetOrg = update.orgNo || existingUser.orgNo
      if (targetOrg && existingUser.activerole) {
        const limitCheck = await canCreateMore(targetOrg, existingUser.activerole)
        if (!limitCheck.allowed) return sendError(res, limitCheck.message || 'Plan limits prevent reactivating this user')
      }
    }

    // Determine whether we need to update organisation counts
  const roleFieldMap = { admin: 'counts.users', manager: 'counts.managers', staff: 'counts.staff', production_head: 'counts.production_head', accountant: 'counts.accountant' }

    const oldRole = existingUser.activerole
    const newRole = update.activerole || oldRole
    const oldOrg = existingUser.orgNo
    const newOrg = update.orgNo !== undefined ? update.orgNo : oldOrg

    const wasBlocked = !!existingUser.block_status
    const willBeBlocked = update.block_status !== undefined ? !!update.block_status : wasBlocked

    const orgUpdates = {}

    // Helper to add incs: orgUpdates[orgNo] = { 'counts.users': x, ... }
    const addInc = (orgNo, field, delta) => {
      if (!orgNo) return
      orgUpdates[orgNo] = orgUpdates[orgNo] || {}
      orgUpdates[orgNo][field] = (orgUpdates[orgNo][field] || 0) + delta
    }

    // If user is being blocked now -> decrement their existing role from their org
    if (!wasBlocked && willBeBlocked) {
      if (oldRole && oldOrg) addInc(oldOrg, roleFieldMap[oldRole], -1)
    }

    // If user is being unblocked now -> increment their role in target org
    if (wasBlocked && !willBeBlocked) {
      if (newRole && newOrg) addInc(newOrg, roleFieldMap[newRole], 1)
    }

    // Role changed while active -> move counts within same org or across orgs
    if (newRole !== oldRole && !wasBlocked && !willBeBlocked) {
      if (oldOrg === newOrg) {
        if (oldRole) addInc(oldOrg, roleFieldMap[oldRole], -1)
        if (newRole) addInc(newOrg, roleFieldMap[newRole], 1)
      } else {
        if (oldRole && oldOrg) addInc(oldOrg, roleFieldMap[oldRole], -1)
        if (newRole && newOrg) addInc(newOrg, roleFieldMap[newRole], 1)
      }
    }

    // Org moved without role change while active
    if (oldOrg !== newOrg && newRole === oldRole && !wasBlocked && !willBeBlocked) {
      if (oldRole && oldOrg) addInc(oldOrg, roleFieldMap[oldRole], -1)
      if (oldRole && newOrg) addInc(newOrg, roleFieldMap[oldRole], 1)
    }

    // If there are orgUpdates, perform them in a transaction along with the user update
    const hasOrgUpdates = Object.keys(orgUpdates).length > 0

    if (hasOrgUpdates) {
      const session = await mongoose.startSession()
      session.startTransaction()
      try {
        const user = await UserModal.findByIdAndUpdate(id, update, { new: true, session }).lean()
        if (!user) {
          await session.abortTransaction()
          session.endSession()
          return sendError(res, 'User not found')
        }

        // apply all org updates
        const orgUpdatePromises = Object.entries(orgUpdates).map(([orgNo, incObj]) => {
          return OrganizationModal.findOneAndUpdate({ orgNo }, { $inc: incObj }, { session })
        })
        await Promise.all(orgUpdatePromises)

        await session.commitTransaction()
        session.endSession()

        delete user.password
        return success(res, 'User updated successfully', { user })
      } catch (e) {
        console.error('Failed updating user and org counts transactionally:', e)
        try { await session.abortTransaction() } catch (ee) {}
        try { session.endSession() } catch (ee) {}
        return sendError(res, 'Failed to update user')
      }
    }

    // No org count changes needed, just update the user
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

    // if (hard && requester?.activerole !== 'superadmin') return forbidden(res, 'Not authorized')

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
