const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { success, error: sendError, notFound, forbidden, error } = require('../../utils/response');

const { StockModal } = require('../../models/stock/stock-scheema');
const SupplierCustomer = require('../../models/supplier/supplier-customer-scheema');
const { SaleOrder } = require('../../models/sales/sales-scheema');

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

    const updated = await SaleOrder.findOneAndUpdate({ _id: id, orgNo }, { $set: { status: 'submitted' } }, { new: true }).lean();
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

    const updated = await SaleOrder.findOneAndUpdate({ _id: id, orgNo }, { $set: { status: 'completed', completedBy: req.profile._id, completedAt: new Date() } }, { new: true }).lean();
    return success(res, 'Sale completed', updated);
  } catch (err) {
    logger.error('Complete sale error', err);
    return sendError(res, err.message || 'Internal server error');
  }
};

// Get all sales with role-based filter
const GetAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 25, status, search, fromDate, toDate, customerId, minTotal, maxTotal, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
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

    // staff: own only, manager/admin: all
    // if (req.profile.activerole === 'staff') filter.createdBy = req.profile._id;

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

    return success(res, 'Sales retrieved', { items: data, total, totals });
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
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('items.stockId', 'productName sku description')
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
  GetSalesAnalytics
};
