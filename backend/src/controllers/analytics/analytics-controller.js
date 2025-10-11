const mongoose = require('mongoose')
const { success, error: sendError } = require('../../utils/response')
const { SaleOrder } = require('../../models/sales/sales-scheema')
const { StockModal } = require('../../models/stock/stock-scheema')
const SupplierCustomer = require('../../models/supplier/supplier-customer-scheema')
const { PurchaseOrderModal } = require('../../models/purchase-order/purchase-order-scheema')

// Helper: build match stage using orgNo and optional date range
function buildMatch(req) {
    const orgNo = req.profile?.orgNo 
    const match = {}
    if (orgNo) match.orgNo = orgNo

    const { startDate, endDate, status, customerId, warehouseId } = req.query || {}
    if (startDate || endDate) {
        match.createdAt = {}
        if (startDate) match.createdAt.$gte = new Date(startDate)
        if (endDate) match.createdAt.$lte = new Date(endDate)
    }
    if (status) match.status = status
    if (customerId) match.customerId = mongoose.Types.ObjectId(customerId)
    if (warehouseId) match['items.stockId'] = mongoose.Types.ObjectId(warehouseId) // best-effort filter
    return match
}

// 1) Summary: combined metrics in a single DB call using $facet
const SummeryController = async (req, res) => {
    try {
        const match = buildMatch(req)

        const pipeline = [
            { $match: match },
            {
                $facet: {
                    salesSummary: [
                        { $unwind: '$items' },
                        {
                            $lookup: {
                                from: StockModal.collection.name,
                                localField: 'items.stockId',
                                foreignField: '_id',
                                as: 'stock'
                            }
                        },
                        { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: '$_id',
                                grandTotal: { $first: '$grandTotal' },
                                totalCOGS: {
                                    $sum: {
                                        $multiply: [
                                            '$items.quantity',
                                            { $ifNull: ['$stock.purchasePrice', 0] }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: { $ifNull: ['$grandTotal', 0] } },
                                avgOrderValue: { $avg: { $ifNull: ['$grandTotal', 0] } },
                                totalCOGS: { $sum: '$totalCOGS' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalOrders: 1,
                                totalRevenue: 1,
                                avgOrderValue: 1,
                                totalCOGS: 1,
                                totalProfit: { $subtract: ['$totalRevenue', '$totalCOGS'] }
                            }
                        }
                    ],
                    statusCounts: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    topCustomers: [
                        { $group: { _id: '$customerId' } },
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ],
                    quickTotals: [
                        { $group: { _id: null, minDate: { $min: '$createdAt' }, maxDate: { $max: '$createdAt' } } }
                    ]
                }
            }
        ]

        const [result] = await SaleOrder.aggregate(pipeline).allowDiskUse(true)

        const salesSummary = (result?.salesSummary && result.salesSummary[0]) || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalCOGS: 0, totalProfit: 0 }
        const statusCounts = (result?.statusCounts) || []
        const topCustomers = (result?.topCustomers) || []
        const quickTotals = (result?.quickTotals && result.quickTotals[0]) || {}

        return success(res, 'Summary fetched', { salesSummary, statusCounts, topCustomers, quickTotals })
    } catch (err) {
        console.error('SummaryController error:', err)
        return sendError(res, 'Could not fetch summary', err)
    }
}

// 2) Revenue trends: grouped by time unit using $dateTrunc when available
const RevenueTrendsController = async (req, res) => {
    try {
        const match = buildMatch(req)
        const { granularity = 'day', limit = 90 } = req.query

        // allowed units: year, quarter, month, week, day, hour
        const unit = ['year', 'quarter', 'month', 'week', 'day', 'hour'].includes(granularity) ? granularity : 'day'

        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateTrunc: { date: '$createdAt', unit, binSize: 1 }
                    },
                    revenue: { $sum: { $ifNull: ['$grandTotal', 0] } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } },
            { $limit: parseInt(limit, 10) }
        ]

        const data = await SaleOrder.aggregate(pipeline).allowDiskUse(true)
        // format dates to ISO for frontend
        const series = data.map(d => ({ period: d._id, revenue: d.revenue, orders: d.orders }))
        return success(res, 'Revenue trends', { series })
    } catch (err) {
        console.error('RevenueTrendsController error:', err)
        return sendError(res, 'Could not fetch revenue trends', err)
    }
}

// 3) Top selling products (by quantity or revenue)
const TopSellingProductsController = async (req, res) => {
    try {
        const match = buildMatch(req)
        const { metric = 'quantity', top = 10 } = req.query
        const sortBy = metric === 'revenue' ? { revenue: -1 } : { quantity: -1 }

        const pipeline = [
            { $match: match },
            { $unwind: '$items' },
            { $group: { _id: '$items.stockId', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
            { $sort: sortBy },
            { $limit: parseInt(top, 10) },
            { $lookup: { from: StockModal.collection.name, localField: '_id', foreignField: '_id', as: 'stock' } },
            { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
            { $project: { productId: '$_id', quantity: 1, revenue: 1, productName: '$stock.productName', sku: '$stock.sku', unit: '$stock.unit' } }
        ]

        const data = await SaleOrder.aggregate(pipeline).allowDiskUse(true)
        return success(res, 'Top selling products', { items: data })
    } catch (err) {
        console.error('TopSellingProductsController error:', err)
        return sendError(res, 'Could not fetch top products', err)
    }
}

// 4) Customer insights: top customers, avg order value, churn indicators
const CustomerInsightsController = async (req, res) => {
    try {
        const match = buildMatch(req)
        const { top = 20 } = req.query

        const pipeline = [
            { $match: match },
            { $group: { _id: '$customerId', orders: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } }, avgOrder: { $avg: { $ifNull: ['$grandTotal', 0] } }, lastOrder: { $max: '$createdAt' } } },
            { $sort: { revenue: -1 } },
            { $limit: parseInt(top, 10) },
            { $lookup: { from: SupplierCustomer.collection.name, localField: '_id', foreignField: '_id', as: 'customer' } },
            { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
            { $project: { customerId: '$_id', orders: 1, revenue: 1, avgOrder: 1, lastOrder: 1, customer: { name: '$customer.name', email: '$customer.email', phone: '$customer.phone', totalSales: '$customer.totalSales' } } }
        ]

        const data = await SaleOrder.aggregate(pipeline).allowDiskUse(true)
        return success(res, 'Customer insights', { items: data })
    } catch (err) {
        console.error('CustomerInsightsController error:', err)
        return sendError(res, 'Could not fetch customer insights', err)
    }
}

// 5) Inventory turnover: COGS / average inventory value
const InventoryTurnoverController = async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        const orgNo = req.profile?.orgNo 

        // COGS: unwind sale items and multiply quantity * purchasePrice (lookup)
        const saleMatch = { orgNo }
        if (startDate || endDate) {
            saleMatch.createdAt = {}
            if (startDate) saleMatch.createdAt.$gte = new Date(startDate)
            if (endDate) saleMatch.createdAt.$lte = new Date(endDate)
        }

        const cogsPipeline = [
            { $match: saleMatch },
            { $unwind: '$items' },
            { $lookup: { from: StockModal.collection.name, localField: 'items.stockId', foreignField: '_id', as: 'stock' } },
            { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
            { $project: { cogs: { $multiply: ['$items.quantity', { $ifNull: ['$stock.purchasePrice', 0] }] } } },
            { $group: { _id: null, totalCOGS: { $sum: '$cogs' } } }
        ]

        const invPipeline = [
            { $match: { orgNo } },
            { $project: { value: { $multiply: ['$quantity', { $ifNull: ['$purchasePrice', 0] }] } } },
            { $group: { _id: null, totalInventoryValue: { $sum: '$value' }, avgInventoryValue: { $avg: '$value' } } }
        ]

        const [cogsRes] = await SaleOrder.aggregate(cogsPipeline).allowDiskUse(true)
        const [invRes] = await StockModal.aggregate(invPipeline).allowDiskUse(true)

        const totalCOGS = (cogsRes && cogsRes.totalCOGS) || 0
        const avgInventoryValue = (invRes && invRes.avgInventoryValue) || (invRes && invRes.totalInventoryValue) || 0
        const turnover = avgInventoryValue > 0 ? totalCOGS / avgInventoryValue : 0

        return success(res, 'Inventory turnover', { totalCOGS, avgInventoryValue, turnover })
    } catch (err) {
        console.error('InventoryTurnoverController error:', err)
        return sendError(res, 'Could not fetch inventory turnover', err)
    }
}

// 6) Sales by region (group by country/state/city using customer address)
const SalesByRegionController = async (req, res) => {
    try {
        const match = buildMatch(req)
        const { level = 'state', top = 20 } = req.query // level: country/state/city

        const pipeline = [
            { $match: match },
            { $lookup: { from: SupplierCustomer.collection.name, localField: 'customerId', foreignField: '_id', as: 'customer' } },
            { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
            { $group: { _id: `$customer.address.${level}`, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } }, orders: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $limit: parseInt(top, 10) },
            { $project: { region: '$_id', revenue: 1, orders: 1, _id: 0 } }
        ]

        const data = await SaleOrder.aggregate(pipeline).allowDiskUse(true)
        return success(res, 'Sales by region', { items: data })
    } catch (err) {
        console.error('SalesByRegionController error:', err)
        return sendError(res, 'Could not fetch sales by region', err)
    }
}

// 7) Profit margins: revenue, COGS, profit, margin
const ProfitMarginsController = async (req, res) => {
    try {
        const match = buildMatch(req)

        // compute revenue and COGS in one pipeline
        const pipeline = [
            { $match: match },
            { $unwind: '$items' },
            { $lookup: { from: StockModal.collection.name, localField: 'items.stockId', foreignField: '_id', as: 'stock' } },
            { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
            { $project: { revenue: { $ifNull: ['$items.total', 0] }, cogs: { $multiply: ['$items.quantity', { $ifNull: ['$stock.purchasePrice', 0] }] } } },
            { $group: { _id: null, totalRevenue: { $sum: '$revenue' }, totalCOGS: { $sum: '$cogs' } } },
            { $project: { _id: 0, totalRevenue: 1, totalCOGS: 1, profit: { $subtract: ['$totalRevenue', '$totalCOGS'] }, margin: { $cond: [{ $gt: ['$totalRevenue', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, '$totalRevenue'] }, 100] }, 0] } } }
        ]

        const [resAgg] = await SaleOrder.aggregate(pipeline).allowDiskUse(true)
        const out = resAgg || { totalRevenue: 0, totalCOGS: 0, profit: 0, margin: 0 }
        return success(res, 'Profit margins', out)
    } catch (err) {
        console.error('ProfitMarginsController error:', err)
        return sendError(res, 'Could not fetch profit margins', err)
    }
}

// PurchaseOrderAnalyticsController
const PurchaseOrderAnalyticsController = async (req, res) => {
    try {
        const orgNo = req.profile?.orgNo || req.query.orgNo
        // allow missing orgNo on PurchaseOrder documents; we will attempt supplier-based scoping if needed
        const { startDate, endDate, top = 10 } = req.query

        const baseMatch = {}
        if (startDate || endDate) {
            baseMatch.createdAt = {}
            if (startDate) baseMatch.createdAt.$gte = new Date(startDate)
            if (endDate) baseMatch.createdAt.$lte = new Date(endDate)
        }

        // build pipeline; we will add supplier lookup filter if PurchaseOrder does not have orgNo path
        const pipeline = []

        // if PurchaseOrder has orgNo field, filter directly
        const poHasOrg = !!PurchaseOrderModal.schema.path('orgNo')
        if (poHasOrg && orgNo) baseMatch.orgNo = orgNo

        // initial match (date range + possible orgNo)
        if (Object.keys(baseMatch).length > 0) pipeline.push({ $match: baseMatch })

        // if PO documents don't have orgNo, but we have orgNo in profile, scope via supplier lookup
        if (!poHasOrg && orgNo) {
            pipeline.push({ $lookup: { from: SupplierCustomer.collection.name, localField: 'supplierId', foreignField: '_id', as: '_supplier' } })
            pipeline.push({ $unwind: { path: '$_supplier', preserveNullAndEmptyArrays: true } })
            pipeline.push({ $match: { '_supplier.orgNo': orgNo } })
        }

        // facet to compute multiple KPIs in one pass
        pipeline.push({
            $facet: {
                totals: [
                    { $group: { _id: null, totalPOs: { $sum: 1 }, totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } }, avgAmount: { $avg: { $ifNull: ['$totalAmount', 0] } } } },
                    { $project: { _id: 0, totalPOs: 1, totalAmount: 1, avgAmount: 1 } }
                ],
                statusCounts: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                topSuppliers: [
                    { $group: { _id: '$supplierId', orders: { $sum: 1 }, amount: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
                    { $sort: { amount: -1 } },
                    { $limit: parseInt(top, 10) },
                    { $lookup: { from: SupplierCustomer.collection.name, localField: '_id', foreignField: '_id', as: 'supplier' } },
                    { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
                    { $project: { supplierId: '$_id', orders: 1, amount: 1, supplier: { name: '$supplier.name', email: '$supplier.email', phone: '$supplier.phone' } } }
                ],
                pendingDeliveries: [
                    { $match: { status: { $in: ['Approved', 'PartiallyReceived'] } } },
                    { $project: { orderNumber: 1, supplierId: 1, expectedDeliveryDate: 1, totalAmount: 1, items: 1 } },
                    { $sort: { expectedDeliveryDate: 1 } },
                    { $limit: 20 },
                    { $lookup: { from: SupplierCustomer.collection.name, localField: 'supplierId', foreignField: '_id', as: 'supplier' } },
                    { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
                    { $project: { orderNumber: 1, expectedDeliveryDate: 1, totalAmount: 1, supplier: { name: '$supplier.name', phone: '$supplier.phone' }, items: 1 } }
                ],
                leadTime: [
                    { $match: { expectedDeliveryDate: { $exists: true, $ne: null }, status: 'Completed' } },
                    { $project: { diffDays: { $divide: [{ $subtract: ['$expectedDeliveryDate', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
                    { $group: { _id: null, avgLeadTime: { $avg: '$diffDays' }, minLeadTime: { $min: '$diffDays' }, maxLeadTime: { $max: '$diffDays' } } },
                    { $project: { _id: 0, avgLeadTime: 1, minLeadTime: 1, maxLeadTime: 1 } }
                ]
            }
        })

        const [result] = await PurchaseOrderModal.aggregate(pipeline).allowDiskUse(true)

        const totals = (result?.totals && result.totals[0]) || { totalPOs: 0, totalAmount: 0, avgAmount: 0 }
        const statusCounts = result?.statusCounts || []
        const topSuppliers = result?.topSuppliers || []
        const pendingDeliveries = result?.pendingDeliveries || []
        const leadTime = (result?.leadTime && result.leadTime[0]) || { avgLeadTime: 0, minLeadTime: 0, maxLeadTime: 0 }

        return success(res, 'Purchase order analytics', { totals, statusCounts, topSuppliers, pendingDeliveries, leadTime })
    } catch (err) {
        console.error('PurchaseOrderAnalyticsController error:', err)
        return sendError(res, 'Could not fetch purchase order analytics', err)
    }
}

module.exports = {
    SummeryController,
    RevenueTrendsController,
    TopSellingProductsController,
    CustomerInsightsController,
    InventoryTurnoverController,
    SalesByRegionController,
    PurchaseOrderAnalyticsController,
    ProfitMarginsController,
}
