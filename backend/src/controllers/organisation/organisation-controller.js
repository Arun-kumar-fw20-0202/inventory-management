const { OrganizationModal, UserModal } = require('../../models/User')
const { success, error: sendError, paginated, validationError, notFound, forbidden } = require('../../utils/response')

/**
 * Create a new organisation
 * Only superadmin can create organisations in this system
 */
const createOrganisation = async (req, res) => {
	try {
		const requester = req.profile
		if (!requester || requester.activerole !== 'superadmin') {
			return forbidden(res, 'Only superadmin can create organisations')
		}

		const { name, orgNo, details = {}, counts = {} } = req.body || {}
		if (!name || !orgNo) return validationError(res, 'name and orgNo are required')

		const exists = await OrganizationModal.findOne({ orgNo })
		if (exists) return sendError(res, `Organisation with orgNo ${orgNo} already exists`, null, 409)

		const org = await OrganizationModal.create({ name, orgNo, details, counts, userId: requester._id })
		return success(res, 'Organisation created', { organisation: org }, 201)
	} catch (err) {
		console.error('createOrganisation error:', err)
		return sendError(res, 'Could not create organisation', err)
	}
}

/**
 * List organisations with pagination and optional search
 * - superadmin: all organisations
 * - admin: only organisations they own (userId) or by orgNo if present
 */
const listOrganisations = async (req, res) => {
	try {
		const requester = req.profile
		const page = Math.max(1, Number(req.query.page) || 1)
		const limit = Math.min(100, Number(req.query.limit) || 20)
		const skip = (page - 1) * limit
		const search = (req.query.search || '').trim()

		const filters = {}
		if (search) {
			filters.$or = [
				{ name: new RegExp(search, 'i') },
				{ orgNo: new RegExp(search, 'i') }
			]
		}

		if (requester?.activerole === 'admin') {
			// admins should only see organisations they belong to/own
			filters.$or = filters.$or || []
			filters.$or.push({ userId: requester._id }, { orgNo: requester.orgNo })
		}

		// superadmin sees all; others constrained above
		const [items, totalCount] = await Promise.all([
			OrganizationModal.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			OrganizationModal.countDocuments(filters)
		])

		const totalPages = Math.ceil((totalCount || 0) / limit)
		return paginated(res, 'Organisations fetched', items, { currentPage: page, totalPages, totalCount, limit, hasNext: page < totalPages, hasPrev: page > 1 })
	} catch (err) {
		console.error('listOrganisations error:', err)
		return sendError(res, 'Could not fetch organisations', err)
	}
}

/**
 * Get organisation by id
 */
const getOrganisationById = async (req, res) => {
	try {
		const requester = req.profile
		const { id } = req.params
		const org = await OrganizationModal.findById(id).lean()
		if (!org) return notFound(res, 'Organisation')

		// Permission: non-superadmin can only view if they belong to the org
		if (requester?.activerole !== 'superadmin') {
			if (String(org.userId) !== String(requester._id) && org.orgNo !== requester.orgNo) return forbidden(res, 'Not authorized to view this organisation')
		}

		return success(res, 'Organisation fetched', { organisation: org })
	} catch (err) {
		console.error('getOrganisationById error:', err)
		return sendError(res, 'Could not fetch organisation', err)
	}
}

/**
 * Get organisation for current user (by orgNo or userId)
 */
const getMyOrganisation = async (req, res) => {
	try {
		const requester = req.profile
		if (!requester) return forbidden(res, 'Unauthorized')

		const org = await OrganizationModal.findOne({ $or: [{ orgNo: requester.orgNo }, { userId: requester._id }] }).lean()
		if (!org) return notFound(res, 'Organisation')
		return success(res, 'Organisation fetched', { organisation: org })
	} catch (err) {
		console.error('getMyOrganisation error:', err)
		return sendError(res, 'Could not fetch organisation', err)
	}
}

/**
 * Update organisation
 */
const updateOrganisation = async (req, res) => {
	try {
		const requester = req.profile
		const { id } = requester
		const update = req.body || {}

		console.log('updateOrganisation body:', req.body)

		const org = await OrganizationModal.findOne({ userId: id })
		console.log(org)
		if (!org) return notFound(res, 'Organisation')

		// Permission: only superadmin or owner (userId) can update
		if (requester?.activerole !== 'superadmin' && String(org.userId) !== String(requester._id)) {
			return forbidden(res, 'Not authorized to update this organisation')
		}

		// If orgNo is changing, check uniqueness
		if (req.profile.orgNo && req.profile.orgNo !== org.orgNo) {
			const exists = await OrganizationModal.findOne({ orgNo: req.profile.orgNo })
			if (exists) return sendError(res, `Organisation with orgNo ${req.profile.orgNo} already exists`, null, 409)
		}

		// apply safe updates
		const allowed = ['name', 'orgNo', 'details', 'counts']
		allowed.forEach((k) => {
			if (Object.prototype.hasOwnProperty.call(update, k)) org[k] = update[k]
		})

		await org.save()
		return success(res, 'Organisation updated', { organisation: org })
	} catch (err) {
		console.error('updateOrganisation error:', err)
		return sendError(res, 'Could not update organisation', err)
	}
}

/**
 * Delete organisation (soft delete or hard delete depending on requirement)
 * Only superadmin allowed here
 */
const deleteOrganisation = async (req, res) => {
	try {
		const requester = req.profile
		if (!requester || requester.activerole !== 'superadmin') return forbidden(res, 'Not authorized')

		const { id } = req.params
		const org = await OrganizationModal.findById(id)
		if (!org) return notFound(res, 'Organisation')

		await org.deleteOne()
		return success(res, 'Organisation deleted')
	} catch (err) {
		console.error('deleteOrganisation error:', err)
		return sendError(res, 'Could not delete organisation', err)
	}
}

/**
 * List members of an organisation by org id
 */
const listOrganisationMembers = async (req, res) => {
	try {
		const requester = req.profile
		const { id } = req.params
		const page = Math.max(1, Number(req.query.page) || 1)
		const limit = Math.min(100, Number(req.query.limit) || 20)
		const skip = (page - 1) * limit

		const org = await OrganizationModal.findById(id).lean()
		if (!org) return notFound(res, 'Organisation')

		// permission: non-superadmin only if they belong to org
		if (requester?.activerole !== 'superadmin' && org.orgNo !== requester.orgNo && String(org.userId) !== String(requester._id)) {
			return forbidden(res, 'Not authorized')
		}

		const filters = { orgNo: org.orgNo }
		const [items, totalCount] = await Promise.all([
			UserModal.find(filters).select('-password -__v -referredBy_count').skip(skip).limit(limit).lean(),
			UserModal.countDocuments(filters)
		])

		const totalPages = Math.ceil((totalCount || 0) / limit)
		return paginated(res, 'Members fetched', items, { currentPage: page, totalPages, totalCount, limit, hasNext: page < totalPages, hasPrev: page > 1 })
	} catch (err) {
		console.error('listOrganisationMembers error:', err)
		return sendError(res, 'Could not fetch members', err)
	}
}

module.exports = {
	createOrganisation,
	listOrganisations,
	getOrganisationById,
	getMyOrganisation,
	updateOrganisation,
	deleteOrganisation,
	listOrganisationMembers
}