const mongoose = require('mongoose')
const { success, error: sendError, notFound } = require('../../utils/response')
const { hasPermission } = require('../../middleware/check-permission-middleware')
const { StockModal } = require('../../models/stock/stock-scheema')
const { SaleOrder } = require('../../models/sales/sales-scheema')
const { PurchaseOrderModal } = require('../../models/purchase-order/purchase-order-scheema')
const SuppliserCustomerModel = require('../../models/supplier/supplier-customer-scheema')

// Helper: apply org & role based scoping
function baseFilterFor(req) {
    const orgNo = req.profile?.orgNo
    const filter = { orgNo }
    const months = Number(req.query.months) || 1
    const since = new Date()
    since.setMonth(since.getMonth() - months)
    if(months){
        filter.createdAt = { $gte: since }
    }
    
    // admin (or superadmin) can see all; others limited
    const role = req.profile?.activerole;
    if (role && ['admin', 'superadmin'].includes(String(role).toLowerCase())) return filter
    // other users see only their own data where applicable
    filter.createdBy = req.profile._id
    return filter
}

// Top products by sold quantity (last 30 days)
const TopProductsController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'stock', 'read')) return res.status(403).json({ error: 'Access denied' })
        const fill = baseFilterFor(req)
        const orgNo = req.profile.orgNo
        const days = Number(req.query.days) || 30
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

        const pipeline = [
            { $match: { ...fill, status: { $ne: 'draft' }, createdAt: { $gte: since } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.stockId', soldQty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
            { $lookup: { from: 'stocks', localField: '_id', foreignField: '_id', as: 'stock' } },
            { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, soldQty: 1, revenue: 1, productName: '$stock.productName', sku: '$stock.sku' } },
            { $sort: { soldQty: -1 } },
            { $limit: 10 }
        ]

        const data = await SaleOrder.aggregate(pipeline)
        return success(res, 'Top products', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Low stock products
const LowStockProductsController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'stock', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        // allow query override for threshold
        const threshold = Number(req.query.threshold ?? 5)
        const filter = { ...roleFilter, quantity: { $lte: threshold }, status: 'active' }
        const items = await StockModal.find(filter).sort({ quantity: 1 }).limit(50).lean()
        return success(res, 'Low stock products', items)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Recent sales (role-scoped)
const RecentSalesController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'sales', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        const limit = Math.min(50, Number(req.query.limit) || 15)
        
        // Single aggregation pipeline for both data and count
        const pipeline = [
            { $match: { ...roleFilter, status: { $ne: 'draft' } } },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'suppliercustomers',
                                localField: 'customerId',
                                foreignField: '_id',
                                as: 'customer',
                                pipeline: [{ $project: { name: 1, email: 1 } }]
                            }
                        },
                        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                orderNumber: 1,
                                customerName: { $ifNull: ['$customer.name', 'Unknown'] },
                                customerEmail: { $ifNull: ['$customer.email', ''] },
                                grandTotal: 1,
                                status: 1,
                                orderNo: 1,
                                itemCount: { $size: '$items' },
                                createdAt: 1
                            }
                        }
                    ],
                    totalCount: [{ $count: 'count' }]
                }
            }
        ]

        const [result] = await SaleOrder.aggregate(pipeline)
        const response = {
            totalCount: result.totalCount[0]?.count || 0,
            recentSales: result.data
        }

        return success(res, 'Recent sales', response)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Sales summary (totals)
const SalesSummaryController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'sales', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        const pipeline = [ { $match: {...roleFilter, status: 'completed'} }, { $group: { _id: null, totalSales: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } } ]
        const agg = await SaleOrder.aggregate(pipeline)
        return success(res, 'Sales summary', agg[0] || { totalSales: 0, revenue: 0 })
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Revenue summary (by month)
const RevenueSummaryController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'sales', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        const pipeline = [ { $match: roleFilter }, 
            // fields i want , revenue and the data for each day 
                {
                $group: {
                    revenue: { $sum: '$grandTotal' },
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                }},
                { $sort: { _id: 1 } } 
            ]
        const data = await SaleOrder.aggregate(pipeline)
        return success(res, 'Revenue summary', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Expense summary (placeholder — requires Expense model)
const ExpenseSummaryController = async (req, res) => {
    try {
        // If an Expense model exists, implement similarly. For now return empty structure.
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'expenses', 'read')) return res.status(403).json({ error: 'Access denied' })
        return success(res, 'Expense summary', { total: 0, byMonth: [] })
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Inventory summary: total items, total quantity
const InventorySummaryController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'stock', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)        
        const pipeline = [ { $match: roleFilter }, { $group: { _id: null, totalItems: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } } ]
        const agg = await StockModal.aggregate(pipeline)
        return success(res, 'Inventory summary', agg[0] || { totalItems: 0, totalQuantity: 0 })
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Customer summary
const CustomerSummaryController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'customer', 'read')) return res.status(403).json({ error: 'Access denied' })
        const orgNo = req.profile.orgNo
        const fil = baseFilterFor(req)
        const count = await SuppliserCustomerModel.countDocuments(fil)
        return success(res, 'Customer summary', { totalCustomers: count })
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Supplier summary
const SupplierSummaryController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'supplier', 'read')) return res.status(403).json({ error: 'Access denied' })
        const orgNo = req.profile.orgNo
        
        const fil = baseFilterFor(req)
        const count = await SuppliserCustomerModel.countDocuments(fil)
        return success(res, 'Supplier summary', { totalSuppliers: count })
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Purchase order summary
const PurchaseOrderSummaryController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'purchase-order', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        const pipeline = [
            { $match: { ...roleFilter, status: { $ne: 'Draft' } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]
        const statusCounts = await PurchaseOrderModal.aggregate(pipeline)
        
        // Convert array to object for easier frontend consumption
        const summary = {
            totalPurchaseOrders: 0,
            byStatus: {}
        }
        
        statusCounts.forEach(item => {
            summary.byStatus[item._id] = item.count
            summary.totalPurchaseOrders += item.count
        })
        
        return success(res, 'Purchase order summary', summary)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Recent customers/suppliers
const RecentCustomersController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'customer', 'read')) return res.status(403).json({ error: 'Access denied' })
        // const orgNo = req.profile.orgNo
        const fill = baseFilterFor(req)
        const data = await SuppliserCustomerModel.find(fill).sort({ createdAt: -1 }).limit(10).lean()
        return success(res, 'Recent customers', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

const RecentSuppliersController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'supplier', 'read')) return res.status(403).json({ error: 'Access denied' })
        // const orgNo = req.profile.orgNo
        const fill = baseFilterFor(req)
        const data = await SuppliserCustomerModel.find(fill).sort({ createdAt: -1 }).limit(10).lean()
        return success(res, 'Recent suppliers', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Pending and overdue purchase orders
const PendingPurchaseOrdersController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'purchase-order', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        const data = await PurchaseOrderModal.find({ 
            ...roleFilter, 
            // status : 'PendingApproval' or "PartiallyReceived"
            status: { $in: ['PendingApproval', 'PartiallyReceived'] }
        })
        .populate('supplierId', 'name')
        .limit(20).lean()
        return success(res, 'Pending purchase orders', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

const OverduePurchaseOrdersController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'purchase-order', 'read')) return res.status(403).json({ error: 'Access denied' })
        const roleFilter = baseFilterFor(req)
        const today = new Date()
        const data = await PurchaseOrderModal.find({ ...roleFilter, expectedDeliveryDate: { $lt: today }, status: { $ne: 'Completed' } }).limit(50).lean()
        return success(res, 'Overdue purchase orders', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

// Top customers / suppliers by revenue (sales)
const TopCustomersController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'sales', 'read')) return res.status(403).json({ error: 'Access denied' })
        // const orgNo = req.profile.orgNo
        const fill = baseFilterFor(req)
        const pipeline = [ { $match: { ...fill, status: { $ne: 'draft' } } }, { $group: { _id: '$customerId', totalSpent: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }, { $lookup: { from: 'suppliercustomers', localField: '_id', foreignField: '_id', as: 'customer' } }, { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }, { $project: { _id: 1, totalSpent: 1, orders: 1, name: '$customer.name' } }, { $sort: { totalSpent: -1 } }, { $limit: 10 } ]
        const data = await SaleOrder.aggregate(pipeline)
        return success(res, 'Top customers', data)
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}

const TopSuppliersController = async (req, res) => {
    try {
        // if (!hasPermission(req.profile?.permissions || req.profile?.permissionDoc, 'supplier', 'read')) return res.status(403).json({ error: 'Access denied' })
        // For suppliers we may aggregate purchase orders; returning empty until PO supplier relation is defined
        return success(res, 'Top suppliers', [])
    } catch (err) { return sendError(res, err.message || 'Internal error') }
}


module.exports = {
    TopProductsController,
    LowStockProductsController,
    RecentSalesController,
    SalesSummaryController,
    RevenueSummaryController,
    ExpenseSummaryController,
    InventorySummaryController,
    CustomerSummaryController,
    SupplierSummaryController,
    PurchaseOrderSummaryController,
    RecentCustomersController,
    RecentSuppliersController,
    PendingPurchaseOrdersController,
    OverduePurchaseOrdersController,
    TopCustomersController,
    TopSuppliersController
};