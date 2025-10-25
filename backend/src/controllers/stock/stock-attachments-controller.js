const { StockAttachmentModel } = require('../../models/stock/stock-attachments-schema');
const { success, error: sendError, notFound } = require('../../utils/response');
const logger = require('../../utils/logger');
const { StockMakerAttachmentModel } = require('../../models/stock/stock-maker-attachments');
const { StockModal } = require('../../models/stock/stock-scheema');

// Create attachment for a stock item
const createAttachment = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const { name, description, qty = 0, status = 'active' } = req.body || {};

    if (!name) return sendError(res, 'Name is required', 400);

    const doc = new StockAttachmentModel({
      name,
      description,
      qty: Number(qty) || 0,
      orgNo,
      status,
      createdBy: req.profile._id,
    });

    await doc.save();
    return success(res, 'Attachment created', doc);
  } catch (err) {
    logger.error('Create attachment error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// List attachments with pagination, filters, and sorting
// Query params supported: page, limit, search (name), status, stockId, sortBy, sortDir
const listAttachmentsByStock = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const page = req.query.page
    const limit = req.query.limit
    const skip = (page - 1) * limit;
    const { search, status, sortBy = 'createdAt', sortDir = 'desc' } = req.query || {};

    console.log("query params", req.query);

    const filter = { orgNo };
    if (status) filter.status = status;
    if (search) filter.name = { $regex: String(search).trim(), $options: 'i' };

    const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

    // projection to avoid sending large fields; use lean for speed
    const projection = { name: 1, qty: 1,  status: 1, createdAt: 1, description: 1 };

    // run count and data queries in parallel
    const [items, total] = await Promise.all([
      StockAttachmentModel.find(filter).select(projection).sort(sort).skip(skip).limit(limit).lean(),
      StockAttachmentModel.countDocuments(filter)
    ]);

    return success(res, 'Attachments retrieved', { items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error('List attachments error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Get attachment by id
const getAttachmentById = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const id = req.params.id;
    const doc = await StockAttachmentModel.findOne({ _id: id, orgNo }).lean();
    if (!doc) return notFound(res, 'Attachment not found');
    return success(res, 'Attachment retrieved', doc);
  } catch (err) {
    logger.error('Get attachment error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Update attachment
const updateAttachment = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const id = req.params.id;
    const payload = req.body || {};

    // prevent changing orgNo/createdBy
    delete payload.orgNo;
    delete payload.createdBy;

    const updated = await StockAttachmentModel.findOneAndUpdate({ _id: id, orgNo }, { $set: payload }, { new: true }).lean();
    if (!updated) return notFound(res, 'Attachment not found');
    return success(res, 'Attachment updated', updated);
  } catch (err) {
    logger.error('Update attachment error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const id = req.params.id;
    const removed = await StockAttachmentModel.findOneAndDelete({ _id: id, orgNo }).lean();
    if (!removed) return notFound(res, 'Attachment not found');
    return success(res, 'Attachment deleted', removed);
  } catch (err) {
    logger.error('Delete attachment error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Bulk adjust attachment quantities
// Expected body: { adjustments: [{ id: '...', delta: 5 }, ...] }
const adjustAttachmentQty = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const adjustments = Array.isArray(req.body.adjustments) ? req.body.adjustments : [];
    if (adjustments.length === 0) return sendError(res, 'No adjustments provided', 400);

    const bulkOps = adjustments.map(a => ({
      updateOne: {
        filter: { _id: a.id, orgNo },
        update: { $inc: { qty: Number(a.delta) || 0 } }
      }
    }));

    const resBulk = await StockAttachmentModel.bulkWrite(bulkOps);
    return success(res, 'Adjustments applied', { result: resBulk });
  } catch (err) {
    logger.error('Adjust attachments error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};



const attachAttachmentToStockController = async (req, res) => {
    try{
        const orgNo = req.profile.orgNo;
        const createdBy = req.profile._id;
        const { stockId, attachments } = req.body || {};

        if (!stockId) return sendError(res, 'Stock ID is required', 400);
        if (!Array.isArray(attachments) || attachments.length === 0) return sendError(res, 'Attachments array is required', 400);
        
        const payload = {
            stockId,
            attachments: attachments.map(att => ({
                attachmentId: att.attachmentId,
                quantity: att.quantity
            })),
            orgNo,
            createdBy
        }
        // console.log(payload)

        const doc = await StockMakerAttachmentModel.findOneAndUpdate(
            { stockId, orgNo },
            { $set: payload },
            { new: true, upsert: true }
        );

        const stock = await StockModal.findOne({ _id: stockId, orgNo });
        if(stock){
           stock.attachmentsId = doc._id;
           stock.attachmentsCount= attachments.length;
           stock.totalAttachmentCount = attachments.reduce((sum, att) => sum + (Number(att.quantity) || 0), 0);
           await stock.save();
        }
        
        return success(res, 'Attachments linked to stock item', doc);
        
    }
    catch(err){
        logger.error('Attach/Detach attachment error', err);
        return sendError(res, err.message || 'Internal server error');
    }

}

module.exports = {
  createAttachment,
  listAttachmentsByStock,
  getAttachmentById,
  updateAttachment,
  deleteAttachment,
  adjustAttachmentQty,
  attachAttachmentToStockController
};
