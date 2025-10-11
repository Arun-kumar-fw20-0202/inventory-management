'use strict'
const mongoose = require('mongoose')
const { PlanModel } = require('../../models/pricing/pricing-scheema')
const { success, error: sendError, forbidden } = require('../../utils/response')

/**
 * Pricing controller - production ready
 * Endpoints:
 *  - createPlan (POST)          [superadmin]
 *  - fetchPlans (GET)           [authenticated]
 *  - getPlanById (GET)         [authenticated]
 *  - updatePlan (PUT)          [superadmin]
 *  - deletePlan (DELETE)       [superadmin]
 */

// Helper: validate limits object (managers/staff)
const validateLimits = (limits) => {
  if (!limits) return false
  const keys = ['managers', 'staff']
  for (const k of keys) {
    const v = limits[k]
    if (v === undefined || v === null) return false
    if (v === 'unlimited') continue
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0) return false
  }
  return true
}

const createPlan = async (req, res) => {
  let session = null
  try {
    const actor = req.profile
    if (!actor || actor.activerole !== 'superadmin') return forbidden(res, 'Only superadmin can create plans')

  const { name, description, limits, price = 0, currency = 'INR', discountPrice = 0, features = [], validityMonths = 1, trialDays = 0, isPopular=false } = req.body || {}

    // if (!name || !validateLimits(limits)) return sendError(res, 'Invalid payload: name and valid limits are required')

    // Prevent dup names
    const exists = await PlanModel.exists({ name: name.trim() })
    if (exists) return sendError(res, `A plan with name '${name}' already exists`)

    session = await mongoose.startSession()
    session.startTransaction()

    // normalize features: accept array or comma-separated string
    const normalizedFeatures = Array.isArray(features) ? features : (typeof features === 'string' ? features.split(',').map(s => s.trim()).filter(Boolean) : [])

    const plan = new PlanModel({
      name: name.trim(),
      description: description || '',
      limits,
      price: Number(price) || 0,
      discountPrice: Number(discountPrice) || 0,
      currency,
      isPopular: isPopular,
      isActive: true,
      features: normalizedFeatures,
      validityMonths: Number.isInteger(Number(validityMonths)) ? Number(validityMonths) : 1,
      trialDays: Number.isInteger(Number(trialDays)) ? Number(trialDays) : 0,
      createdBy: actor._id,
    })

    await plan.save({ session })
    await session.commitTransaction()
    session.endSession()

    return success(res, 'Plan created successfully', { plan: plan.toObject() })
  } catch (err) {
    console.error('createPlan error:', err)
    if (session) {
      try { await session.abortTransaction() } catch (e) {}
      try { session.endSession() } catch (e) {}
    }
    if (err && err.code === 11000) return sendError(res, 'Duplicate plan name')
    return sendError(res, 'Could not create plan', err)
  }
}

const fetchPlans = async (req, res) => {
  try {
  const { page = 1, limit = 20, q, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = req.query || {}

    const filters = {}
    if (q) filters.name = new RegExp(q, 'i')
  if (isActive !== undefined) filters.isActive = String(isActive) === 'true'
  // customizable filter removed

    const skip = (Number(page) - 1) * Number(limit)
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const [plans, total] = await Promise.all([
      PlanModel.find(filters).lean().sort(sort).skip(skip).limit(Number(limit)),
      PlanModel.countDocuments(filters),
    ])

    return success(res, 'Plans fetched successfully', {
      plans,
      pagination: {
        totalItems: total,
        itemsPerPage: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      }
    })
  } catch (err) {
    console.error('fetchPlans error:', err)
    return sendError(res, 'Could not fetch plans', err)
  }
}

const getPlanById = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return sendError(res, 'Plan id is required')

    const plan = await PlanModel.findById(id).lean()
    if (!plan) return sendError(res, 'Plan not found')

    return success(res, 'Plan fetched successfully', { plan })
  } catch (err) {
    console.error('getPlanById error:', err)
    return sendError(res, 'Could not fetch plan', err)
  }
}

const updatePlan = async (req, res) => {
  let session = null
  try {
    const actor = req.profile
    if (!actor || actor.activerole !== 'superadmin') return forbidden(res, 'Only superadmin can update plans')

    const { id } = req.params
    if (!id) return sendError(res, 'Plan id is required')

  const update = { ...req.body }

    if (update.limits && !validateLimits(update.limits)) return sendError(res, 'Invalid limits')
  if (update.price !== undefined) update.price = Number(update.price)
  if (update.validityMonths !== undefined) update.validityMonths = Number(update.validityMonths)
    // normalize features if provided as CSV string
    if (update.features && typeof update.features === 'string') {
      update.features = update.features.split(',').map(s => s.trim()).filter(Boolean)
    }

    session = await mongoose.startSession()
    session.startTransaction()

    const plan = await PlanModel.findById(id).session(session)
    if (!plan) {
      await session.abortTransaction()
      session.endSession()
      return sendError(res, 'Plan not found')
    }

  // plans are managed by superadmin via API
    Object.keys(update).forEach(k => {
      if (k === 'name') plan.name = String(update.name).trim()
      else if (k === 'limits') plan.limits = update.limits
      else if (k === 'description') plan.description = update.description
      else if (k === 'price') plan.price = Number(update.price)
      else if (k === 'discountPrice') plan.discountPrice = Number(update.discountPrice)
      else if (k === 'currency') plan.currency = update.currency
      else if (k === 'isActive') plan.isActive = update.isActive
      else if (k === 'features') plan.features = Array.isArray(update.features) ? update.features : plan.features
      else if (k === 'validityMonths') plan.validityMonths = Number.isInteger(Number(update.validityMonths)) ? Number(update.validityMonths) : plan.validityMonths
      else if (k === 'trialDays') plan.trialDays = Number.isInteger(Number(update.trialDays)) ? Number(update.trialDays) : plan.trialDays
      else if (k === 'isPopular') plan.isPopular = !!update.isPopular
    })

    await plan.save({ session })
    await session.commitTransaction()
    session.endSession()

    return success(res, 'Plan updated successfully', { plan: plan.toObject() })
  } catch (err) {
    console.error('updatePlan error:', err)
    if (session) {
      try { await session.abortTransaction() } catch (e) {}
      try { session.endSession() } catch (e) {}
    }
    if (err && err.code === 11000) return sendError(res, 'Duplicate plan name')
    return sendError(res, 'Could not update plan', err)
  }
}

const deletePlan = async (req, res) => {
  let session = null
  try {
    const actor = req.profile
    if (!actor || actor.activerole !== 'superadmin') return forbidden(res, 'Only superadmin can delete plans')

    const { id } = req.params
    const hard = req.query.hard === 'true'
    if (!id) return sendError(res, 'Plan id is required')

    if (hard) {
      await PlanModel.findByIdAndDelete(id)
      return success(res, 'Plan permanently deleted')
    }

    // soft delete
    const plan = await PlanModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean()
    if (!plan) return sendError(res, 'Plan not found')

    return success(res, 'Plan deactivated successfully', { plan })
  } catch (err) {
    console.error('deletePlan error:', err)
    return sendError(res, 'Could not delete plan', err)
  }
}

module.exports = {
  createPlan,
  fetchPlans,
  getPlanById,
  updatePlan,
  deletePlan,
}
