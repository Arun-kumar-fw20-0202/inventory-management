const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { success, error: sendError, notFound, forbidden, error } = require('../../utils/response');

const { StockModal } = require('../../models/stock/stock-scheema');
const SupplierCustomer = require('../../models/supplier/supplier-customer-scheema');
const { SaleOrder } = require('../../models/sales/sales-scheema');
const { StockMakerAttachmentModel } = require('../../models/stock/stock-maker-attachments');
const { StockAttachmentModel } = require('../../models/stock/stock-attachments-schema');

// In-memory cache placeholder
const analyticsCache = new Map();

// Create Sale (draft)
const createSaleSale = async (req, res) => {
  try {

    const { customerId, items = [], subTotal = 0, tax = 0,taxType, discount = 0,discountType, grandTotal = 0, invoiceNo } = req.body;
    const orgNo = req.profile.orgNo;

    if (!customerId) return sendError(res, 'customerId is required', 400);

    const customer = await SupplierCustomer.findOne({ _id: customerId, orgNo }).lean();
    if (!customer) return notFound(res, 'Customer not found');

    if (!Array.isArray(items) || items.length === 0) return sendError(res, 'items are required', 400);

    // validate stock ids exist
    const stockIds = items.map(i => i.stockId);
    const stocks = await StockModal.find({ _id: { $in: stockIds }, orgNo }).select('_id quantity sellingPrice productName').lean();
    const stockMap = new Map(stocks.map(s => [String(s._id), s]));

    for (const it of items) {
      const s = stockMap.get(String(it.stockId));
      if (!s) return notFound(res, `Stock ${it.stockId} not found`);
      if (it.quantity <= 0) return sendError(res, 'Item quantity must be > 0', 400);
    }

    // generate order number (simple timestamp + random) — can be replaced by a robust generator
    const orderNo = `SO-${Date.now().toString(36)}-${Math.floor(Math.random() * 9000) + 1000}`;

    const sale = new SaleOrder({
        orderNo,
        customerId,
        items,
        subTotal,
        tax,
        discount,
        grandTotal,
        taxType,
        invoiceNo: invoiceNo,
        discountType,
        createdBy: req.profile._id,
        orgNo
    });

    await sale.save();
    // Note: customer metrics (totalSales, metrics.averageOrderValue, lastSaleAmount)
    // are intentionally NOT updated here. Metrics should reflect completed sales only.

    return success(res, 'Sale created', sale);
  } catch (err) {
    logger.error('Create sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Submit sale for approval
const SubmitSale = async (req, res) => {
  try {
    const id = req.params.id;
    const orgNo = req.profile.orgNo;

    const sale = await SaleOrder.findOne({ _id: id, orgNo }).lean();
    if (!sale) return notFound(res, 'Sale not found');
    if (sale.status !== 'draft') return sendError(res, 'Only draft sales can be submitted', 400);

    const updated = await SaleOrder.findOneAndUpdate({ _id: id, orgNo }, { $set: { 
      status: 'submitted',
      submittedBy: req.profile._id,
      submittedAt: new Date()
    } }, { new: true }).lean();

    // Send notification to approvers (admins/managers) depending on submitter role
    
    return success(res, 'Sale submitted for approval', updated);
  } catch (err) {
    logger.error('Submit sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Approve sale — deduct stock using transaction
const ApproveSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    const orgNo = req.profile.orgNo;

    const sale = await SaleOrder.findOne({ _id: id, orgNo }).session(session).lean();
    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return notFound(res, 'Sale not found');
    }
    if (sale.status !== 'submitted') {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'Only submitted sales can be approved', 400);
    }

    // load stocks and ensure quantities available
    const stockIds = sale.items.map(i => i.stockId);
    const stocks = await StockModal.find({ _id: { $in: stockIds }, orgNo }).session(session).select('quantity').lean();
    const stockMap = new Map(stocks.map(s => [String(s._id), s]));

    for (const it of sale.items) {
      const s = stockMap.get(String(it.stockId));
      if (!s) {
        await session.abortTransaction();
        session.endSession();
        return notFound(res, `Stock ${it.stockId} not found`);
      }
      if (s.quantity < it.quantity) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, `Insufficient stock for ${it.stockId}`);
      }
    }

    // --- Attachment handling ---
    // For each stock item being sold, find maker->attachments mapping and compute total required per attachment
    // StockMakerAttachmentModel stores documents mapping a stockId to attachments: [{ attachmentId, quantity }]
    const makerDocs = await StockMakerAttachmentModel.find({ stockId: { $in: stockIds }, orgNo }).session(session).lean();
    // map stockId -> attachments array
    const makerMap = new Map(makerDocs.map(d => [String(d.stockId), d.attachments || []]));

    // aggregate required qty per attachmentId
    const requiredByAttachment = new Map(); // attachmentId -> requiredQty
    for (const it of sale.items) {
      const attachmentsForStock = makerMap.get(String(it.stockId)) || [];
      for (const attach of attachmentsForStock) {
        const aid = String(attach.attachmentId);
        const perUnit = Number(attach.quantity || 0);
        if (perUnit <= 0) continue; // nothing to consume
        const need = perUnit * Number(it.quantity || 0);
        requiredByAttachment.set(aid, (requiredByAttachment.get(aid) || 0) + need);
      }
    }

    // Verify availability of attachments
    if (requiredByAttachment.size > 0) {
      const attachmentIds = Array.from(requiredByAttachment.keys());
      const attachments = await StockAttachmentModel.find({ _id: { $in: attachmentIds }, orgNo }).session(session).select('qty').lean();
      const attMap = new Map(attachments.map(a => [String(a._id), a]));

      for (const [aid, reqQty] of requiredByAttachment.entries()) {
        const att = attMap.get(String(aid));
        if (!att) {
          await session.abortTransaction();
          session.endSession();
          return notFound(res, `Attachment ${aid} not found`);
        }
        if (att.qty < reqQty) {
          await session.abortTransaction();
          session.endSession();
          return sendError(res, `Insufficient attachment '${aid}' (need ${reqQty}, have ${att.qty})`);
        }
      }

      // prepare bulk ops to decrement attachments
      const attachmentBulkOps = Array.from(requiredByAttachment.entries()).map(([aid, reqQty]) => ({
        updateOne: {
          filter: { _id: aid, orgNo, qty: { $gte: reqQty } },
          update: { $inc: { qty: -Math.abs(reqQty) } }
        }
      }));

      if (attachmentBulkOps.length > 0) {
        const attRes = await StockAttachmentModel.bulkWrite(attachmentBulkOps, { session });
        // Note: bulkWrite result can be inspected for nModified etc. We trust the filter guarded by qty to prevent negatives.
      }
    }

    // Deduct stock using bulkWrite
    const bulkOps = sale.items.map(it => ({
      updateOne: {
        filter: { _id: it.stockId, orgNo },
        update: { $inc: { quantity: -Math.abs(it.quantity) } }
      }
    }));

    if (bulkOps.length > 0) {
      await StockModal.bulkWrite(bulkOps, { session });
    }

    const updated = await SaleOrder.findOneAndUpdate({ _id: id, orgNo }, { $set: { status: 'approved', approvedBy: req.profile._id, approvedAt: new Date() } }, { new: true, session }).lean();

    await session.commitTransaction();
    session.endSession();

    // Notify creator that sale was approved
    return success(res, 'Sale approved and stock updated', updated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Approve sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Reject sale
const RejectSale = async (req, res) => {
  try {
    const id = req.params.id;
    const orgNo = req.profile.orgNo;
    const { reason } = req.body || {};

    const sale = await SaleOrder.findOne({ _id: id, orgNo }).lean();
    if (!sale) return notFound(res, 'Sale not found');
    if (['approved', 'completed'].includes(sale.status)) return sendError(res, 'Cannot reject an approved or completed sale', 400);

    const updated = await SaleOrder.findOneAndUpdate({ _id: id, orgNo }, { $set: { status: 'rejected', rejectedBy: req.profile._id, rejectedAt: new Date(), rejectedReason: reason || '' } }, { new: true }).lean();

    // Notify creator about rejection and admins with staff name
  
    return success(res, 'Sale rejected', updated);
  } catch (err) {
    logger.error('Reject sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Complete sale (mark as completed after payment)
const CompleteSale = async (req, res) => {
  try {
    const id = req.params.id;
    const orgNo = req.profile.orgNo;
    const sale = await SaleOrder.findOne({ _id: id, orgNo }).lean();
    if (!sale) return notFound(res, 'Sale not found');
    if (sale.status !== 'approved') return sendError(res, 'Only approved sales can be completed', 400);

    // Mark sale as completed first
    const updated = await SaleOrder.findOneAndUpdate(
      { _id: id, orgNo },
      { $set: { status: 'completed', completedBy: req.profile._id, completedAt: new Date() } },
      { new: true }
    ).lean();

      // Notify creator about completion and admins with staff name

    // After marking completed, update customer metrics atomically (best-effort)
    try {
      const customerId = sale.customerId;
      const saleAmount = Number(sale.grandTotal || sale.total || 0);
      if (customerId && saleAmount > 0) {
        // Use aggregation-style update pipeline to perform atomic increments and recalculation
        await SupplierCustomer.findOneAndUpdate(
          { _id: customerId, orgNo },
          [
            {
              $set: {
                totalSales: { $add: ["$totalSales", saleAmount] },
                lastSaleAmount: saleAmount,
                lastTransactionDate: new Date(),
                "metrics.totalOrders": { $add: ["$metrics.totalOrders", 1] },
                "metrics.totalSalesOrders": { $add: ["$metrics.totalSalesOrders", 1] },
                "metrics.averageOrderValue": {
                  $let: {
                    vars: {
                      prevAvg: { $ifNull: ["$metrics.averageOrderValue", 0] },
                      prevCount: { $ifNull: ["$metrics.totalOrders", 0] }
                    },
                    in: {
                      $cond: [
                        { $gt: ["$$prevCount", 0] },
                        { $divide: [ { $add: [ { $multiply: ["$$prevAvg", "$$prevCount"] }, saleAmount ] }, { $add: [ "$$prevCount", 1 ] } ] },
                        saleAmount
                      ]
                    }
                  }
                }
              }
            }
          ],
          { new: true }
        ).lean();
      }
    } catch (metricErr) {
      // Log failure, but don't revert completed status — metrics update is best-effort
      logger.error('Failed to update customer metrics after sale completion', metricErr);
    }

    return success(res, 'Sale completed', updated);
  } catch (err) {
    logger.error('Complete sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Get all sales with role-based filter
const GetAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 25, status, search, fromDate, toDate, customerId, creatorId, minTotal, maxTotal, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const orgNo = req.profile.orgNo;

    const filter = { orgNo };
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (minTotal) filter.grandTotal = { ...(filter.grandTotal || {}), $gte: Number(minTotal) };
    if (maxTotal) filter.grandTotal = { ...(filter.grandTotal || {}), $lte: Number(maxTotal) };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // Role-based filtering for draft data
    if (req.profile.activerole !== 'admin') {
      filter.createdBy = req.profile._id;
    } else  {
      filter.$or = [
        { createdBy: req.profile._id }, // All their own data
        { status: { $ne: 'draft' } } // Others' non-draft data
      ];

      if(creatorId){
        filter.createdBy = creatorId
      }
    }
    // Admin can see everything (no additional filter)

    if (search) {
      filter.$or = [
        { orderNo: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
        { 'customerId.name': { $regex: search, $options: 'i' } },
        { 'createdBy.name': { $regex: search, $options: 'i' } }
      ];
    }
    const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

    const [data, total, aggregates] = await Promise.all([
      SaleOrder.find(filter).sort(sort)
        .skip(skip).limit(Number(limit))
        .populate('customerId', 'name email phone')
        .populate('createdBy' , 'name email')
        .populate('items.stockId', 'productName sku description')
        .lean(),
      SaleOrder.countDocuments(filter),
      SaleOrder.aggregate([
        { $match: filter },
        { $group: { _id: null, totalSales: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } }
      ])
    ]);

    const totals = (aggregates[0]) || { totalSales: 0, revenue: 0 };

    return success(res, 'Sales retrieved', { 
      items: data, 
      total, totals,
      pagination: { page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    logger.error('Get all sales error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Get sale details
const GetSaleById = async (req, res) => {
  try {
    const id = req.params.id;
    const orgNo = req.profile.orgNo;
    const sale = await SaleOrder.findOne({ _id: id, orgNo })
      .populate('customerId', 'name email phone address companyName creditLimit currentBalance')
      .populate('submittedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('items.stockId', 'productName sku description quantity')
      .lean();
    if (!sale) return notFound(res, 'Sale not found');
    // staff may only view own
    return success(res, 'Sale retrieved', sale);
  } catch (err) {
    logger.error('Get sale by id error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Delete sale (only if draft)
const DeleteSale = async (req, res) => {
  try {
    const id = req.params.id;
    const orgNo = req.profile.orgNo;

    const sale = await SaleOrder.findOne({ _id: id, orgNo }).lean();
    if (!sale) return notFound(res, 'Sale not found');
    if (sale.status !== 'draft') return sendError(res, 'Only draft sales can be deleted', 400);

    await SaleOrder.deleteOne({ _id: id, orgNo });
    return success(res, 'Sale deleted');
  } catch (err) {
    logger.error('Delete sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// 
// Mark as paid
const MarkOrderAsPaid = async (req, res) => {
  try{
    const { id } = req.params;
    const { status='pending' } = req.query

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 'Invalid purchase order ID', null, 400);
    }
    if (!['paid', 'partial', 'unpaid'].includes(status)) {
      return error(res, 'Invalid payment status', null, 400);
    }

    const verifSale = await SaleOrder.findOne({ _id: id, orgNo: req.profile.orgNo })
    .select('_id status paymentStatus')
    .lean();

    if(!verifSale){
      return notFound(res, 'Sale order not found');
    }

    if(verifSale.status === 'rejected' || verifSale.status === 'draft' && req.profile.activerole !== 'admin'){
      return forbidden(res, 'Cannot mark payment for rejected or draft orders');
    }
    
    const orgNo = req.profile.orgNo;
    // udpate order status
    const order = await SaleOrder.findOneAndUpdate(
      { _id: id, orgNo },
      { $set: { paymentStatus: status, markedAsPaidBy: req.profile._id } },
      { new: true }
    ).lean();

    if (!order) {
      return notFound(res, 'Sale order not found');
    }
    return success(res, 'Sale order payment status updated', order);
  }
  catch(err){
    console.error('Mark order as paid error:', err);
    return error(res, 'Failed to mark order as paid', err, 500);
  }
}

// Analytics
const GetSalesAnalytics = async (req, res) => {
  try {
    const orgNo = req.profile.orgNo;
    const cacheKey = `${orgNo}:sales:analytics`;
    if (analyticsCache.has(cacheKey)) {
      return success(res, 'Sales analytics (cached)', analyticsCache.get(cacheKey));
    }

    const pipeline = [
      { $match: { orgNo, status: { $ne: 'draft' } } },
      {
        $facet: {
          totals: [
            { $group: { _id: null, totalSales: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } }
          ],
          topProducts: [
            { $unwind: '$items' },
            { $group: { _id: '$items.stockId', soldQty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
            { $sort: { soldQty: -1 } },
            { $limit: 10 }
          ],
          pendingApprovals: [ { $match: { status: 'submitted' } }, { $count: 'pending' } ]
        }
      }
    ];

    const agg = await SaleOrder.aggregate(pipeline);
    const result = {
      totals: agg[0].totals[0] || { totalSales: 0, revenue: 0 },
      topProducts: agg[0].topProducts || [],
      pendingApprovals: (agg[0].pendingApprovals[0] && agg[0].pendingApprovals[0].pending) || 0
    };

    analyticsCache.set(cacheKey, result);
    // cache for 2 minutes
    setTimeout(() => analyticsCache.delete(cacheKey), 2 * 60 * 1000);

    return success(res, 'Sales analytics', result);
  } catch (err) {
    logger.error('Sales analytics error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Update sale only draft status can be updated 
const UpdateSaleController = async (req, res) => {
  try {
    const id = req.params.id;
    const activerole = req.profile.activerole;
    const orgNo = req.profile.orgNo;
    const updateData = req.body;
    const sale = await SaleOrder.findOne({ _id: id, orgNo }).select('status').lean();
    if (!sale) return notFound(res, 'Sale not found');
    if (activerole != 'admin') {
      if (sale.status !== 'draft') return sendError(res, 'Only draft sales can be updated', 400);
    }
    const updated = await SaleOrder.findOneAndUpdate({ _id: id, orgNo }, { $set: updateData }, { new: true }).lean();
    return success(res, 'Sale updated', updated);
  } catch (err) {
    logger.error('Update sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
}

module.exports = {
  createSaleSale,
  SubmitSale,
  ApproveSale,
  RejectSale,
  CompleteSale,
  MarkOrderAsPaid,
  GetAllSales,
  GetSaleById,
  DeleteSale,
  UpdateSaleController,
  GetSalesAnalytics
};
