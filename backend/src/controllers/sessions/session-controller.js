const { SessionModel } = require("../../models/session/SessionSchema");
const { success, error, paginated, notFound, validationError } = require("../../utils/response");
const mongoose = require('mongoose');

/**
 * Fetch sessions for the current organization (admin/superadmin)
 * Supports pagination and simple filtering: userId, activeOnly
 */
const FetchSessionsController = async (req, res) => {
    try {
        const orgNo = req.profile?.orgNo;
        if (!orgNo) return validationError(res, 'Organization number not found for user');

        // parse query params
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, Math.max(5, parseInt(req.query.limit || '20', 10)));
        const { userId, activeOnly } = req.query;

        const filter = { orgNo };
        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) return validationError(res, 'Invalid userId');
            filter.userId = mongoose.Types.ObjectId(userId);
        }

        if (String(activeOnly) === 'true') {
            filter.revoked = false;
            filter.expiresAt = { $gt: new Date() };
        }

        const [items, totalCount] = await Promise.all([
            SessionModel.find(filter)
                .select('-tokenHash -refreshTokenHash') // don't expose sensitive hashes
                .populate('userId', 'name email phone activerole') // populate user details
                .sort({ lastUsedAt: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            SessionModel.countDocuments(filter)
        ]);

        return paginated(res, 'Sessions fetched', items, {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            limit
        });
    } catch (err) {
        console.error('Error fetching sessions:', err);
        return error(res, 'Failed to fetch sessions', err);
    }
};


/**
 * Terminate (revoke) a session by id
 * Only sessions belonging to same org are allowed to be terminated by caller
 */
const TerminateSessionController = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const orgNo = req.profile?.orgNo;
        if (!orgNo) return validationError(res, 'Organization number not found for user');

        if (!mongoose.Types.ObjectId.isValid(sessionId)) return validationError(res, 'Invalid session id');

        const session = await SessionModel.findOne({ _id: sessionId, orgNo });
        if (!session) return notFound(res, 'Session');

        // mark revoked (preserve history)
        session.revoked = true;
        await session.save();

        return success(res, 'Session terminated successfully', { id: session._id });
    } catch (err) {
        console.error('Error terminating session:', err);
        return error(res, 'Failed to terminate session', err);
    }
};

module.exports = {
    FetchSessionsController,
    TerminateSessionController
};