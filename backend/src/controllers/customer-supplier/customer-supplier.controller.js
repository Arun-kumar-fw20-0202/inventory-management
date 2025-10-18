const SupplierCustomer = require('../../models/supplier/supplier-customer-scheema');
const { success, error } = require('../../utils/response');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
// ============================
// GOD-LEVEL CACHING SYSTEM
// ============================
const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const CACHE_KEYS = {
   ANALYTICS: 'analytics',
   LIST: 'list',
   SEARCH: 'search'
};

const getCacheKey = (orgNo, key, params = {}) => {
   const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join('|');
   return `${orgNo}:${key}:${paramString}`;
};

const setCache = (key, data) => {
   cache.set(key, {
      data,
      timestamp: Date.now()
   });
};

const getCache = (key) => {
   const cached = cache.get(key);
   if (!cached) return null;
   
   if (Date.now() - cached.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
   }
   
   return cached.data;
};

const clearCachePattern = (pattern) => {
   for (const [key] of cache) {
      if (key.includes(pattern)) {
         cache.delete(key);
      }
   }
};

// ============================
// CONTROLLER METHODS
// ============================

/**
 * Get all supplier/customers with advanced filtering
 */
const getAllSupplierCustomers = async (req, res) => {
   try {
      const { orgNo } = req.profile;
      const {
         page = 1,
         limit = 20,
         type,
         status,
         category,
         search,
         sortBy = 'createdAt',
         sortOrder = 'desc',
         includeInactive = false,
         minCreditLimit,
         maxCreditLimit,
         country,
         state,
         city,
         rating,
         tags,
         paymentTerms
      } = req.query;

      console.log(req.query)

      // Build cache key
      const cacheKey = getCacheKey(orgNo, CACHE_KEYS.LIST, {
         page, limit, type, status, category, search, sortBy, sortOrder,
         includeInactive, minCreditLimit, maxCreditLimit, country, state, city,
         rating, tags, paymentTerms
      });

      // Check cache
      // const cachedData = getCache(cacheKey);
      // if (cachedData) {
      //    return success(res, 'Data retrieved successfully (cached)', cachedData);
      // }

      // Build match conditions
      const matchConditions = { orgNo };

      if (type) {
         if (type === 'both') {
            matchConditions.$or = [
               { type: 'supplier' },
               { type: 'customer' },
               { type: 'both' }
            ];
         } else {
            matchConditions.$or = [
               { type: type },
               // { type: 'both' }
            ];
         }
      }

      if (status) {
         matchConditions.status = Array.isArray(status) ? { $in: status } : status;
      } else if (!includeInactive) {
         matchConditions.status = { $ne: 'inactive' };
      }

      if (category) {
         matchConditions.category = Array.isArray(category) ? { $in: category } : category;
      }

      if (minCreditLimit || maxCreditLimit) {
         matchConditions.creditLimit = {};
         if (minCreditLimit) matchConditions.creditLimit.$gte = Number(minCreditLimit);
         if (maxCreditLimit) matchConditions.creditLimit.$lte = Number(maxCreditLimit);
      }

      if (country) matchConditions['address.country'] = country;
      if (state) matchConditions['address.state'] = state;
      if (city) matchConditions['address.city'] = city;

      if (rating) {
         matchConditions.rating = { $gte: Number(rating) };
      }

      if (tags) {
         const tagArray = Array.isArray(tags) ? tags : tags.split(',');
         matchConditions.tags = { $in: tagArray };
      }

      if (paymentTerms) {
         matchConditions.paymentTerms = paymentTerms;
      }

      if (search) {
         matchConditions.$text = { $search: search };
      }

      // Build aggregation pipeline
      const pipeline = [
         { $match: matchConditions },
         {
            $addFields: {
               displayName: { $ifNull: ['$companyName', '$name'] },
               totalTransactions: { $add: ['$totalPurchases', '$totalSales'] },
               creditUtilization: {
                  $cond: {
                     if: { $eq: ['$creditLimit', 0] },
                     then: 0,
                     else: {
                        $multiply: [
                           { $divide: [{ $abs: '$currentBalance' }, '$creditLimit'] },
                           100
                        ]
                     }
                  }
               },
               isOverdue: { $lt: ['$currentBalance', 0] }
            }
         }
      ];

      if (search) {
         pipeline.push({
            $addFields: { searchScore: { $meta: 'textScore' } }
         });
      }

      // Sorting
      const sortObj = {};
      if (search) {
         sortObj.searchScore = { $meta: 'textScore' };
      }
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
      pipeline.push({ $sort: sortObj });

      // If the requester is a staff member, compute per-staff totals for sales and purchases
      // so the UI can show totals scoped to that staff user instead of global totals.
      const isStaff = req.profile && req.profile.activeRole === 'staff';
      const staffUserId = req.profile && req.profile._id;
      if (isStaff && staffUserId) {
         // Lookup sales created by this staff for each contact
         pipeline.push({
            $lookup: {
               from: 'saleorders',
               let: { contactId: '$_id' },
               pipeline: [
                  { $match: { $expr: { $and: [
                     { $eq: ['$orgNo', orgNo] },
                     { $eq: ['$customerId', '$$contactId'] },
                     { $eq: ['$status', 'completed'] },
                     { $eq: ['$createdBy', mongoose.Types.ObjectId(staffUserId)] }
                  ] } } },
                  { $group: { _id: null, totalSalesByUser: { $sum: '$grandTotal' }, lastSaleAmountByUser: { $max: '$grandTotal' }, salesOrdersCount: { $sum: 1 } } }
               ],
               as: 'userSalesSummary'
            }
         });

         // Lookup purchase orders created by this staff for each contact
         pipeline.push({
            $lookup: {
               from: 'purchaseorders',
               let: { contactId: '$_id' },
               pipeline: [
                  { $match: { $expr: { $and: [
                     { $eq: ['$orgNo', orgNo] },
                     { $eq: ['$supplierId', '$$contactId'] },
                     { $eq: ['$status', 'Completed'] },
                     { $eq: ['$createdBy', mongoose.Types.ObjectId(staffUserId)] }
                  ] } } },
                  { $group: { _id: null, totalPurchasesByUser: { $sum: '$totalAmount' }, lastPurchaseAmountByUser: { $max: '$totalAmount' }, purchaseOrdersCount: { $sum: 1 } } }
               ],
               as: 'userPurchaseSummary'
            }
         });

         // Extract values from the lookup results and override display fields when user-specific data exists
         pipeline.push({
            $addFields: {
               lastSaleAmountComputed: { $ifNull: [ { $arrayElemAt: ['$userSalesSummary.lastSaleAmountByUser', 0] }, null ] },
               totalSalesComputed: { $ifNull: [ { $arrayElemAt: ['$userSalesSummary.totalSalesByUser', 0] }, 0 ] },
               salesOrdersCountComputed: { $ifNull: [ { $arrayElemAt: ['$userSalesSummary.salesOrdersCount', 0] }, 0 ] },

               lastPurchaseAmountComputed: { $ifNull: [ { $arrayElemAt: ['$userPurchaseSummary.lastPurchaseAmountByUser', 0] }, null ] },
               totalPurchasesComputed: { $ifNull: [ { $arrayElemAt: ['$userPurchaseSummary.totalPurchasesByUser', 0] }, 0 ] },
               purchaseOrdersCountComputed: { $ifNull: [ { $arrayElemAt: ['$userPurchaseSummary.purchaseOrdersCount', 0] }, 0 ] }
            }
         });

         pipeline.push({
            $addFields: {
               // Use computed values when staff actually has orders with this contact, otherwise fall back to stored values
               lastSaleAmount: { $cond: [ { $gt: ['$salesOrdersCountComputed', 0] }, '$lastSaleAmountComputed', '$lastSaleAmount' ] },
               lastPurchaseAmount: { $cond: [ { $gt: ['$purchaseOrdersCountComputed', 0] }, '$lastPurchaseAmountComputed', '$lastPurchaseAmount' ] },
               totalSales: { $cond: [ { $gt: ['$salesOrdersCountComputed', 0] }, '$totalSalesComputed', '$totalSales' ] },
               totalPurchases: { $cond: [ { $gt: ['$purchaseOrdersCountComputed', 0] }, '$totalPurchasesComputed', '$totalPurchases' ] },

               'metrics.totalSalesOrders': { $cond: [ { $gt: ['$salesOrdersCountComputed', 0] }, '$salesOrdersCountComputed', '$metrics.totalSalesOrders' ] },
               'metrics.totalPurchaseOrders': { $cond: [ { $gt: ['$purchaseOrdersCountComputed', 0] }, '$purchaseOrdersCountComputed', '$metrics.totalPurchaseOrders' ] }
            }
         });

         // Recompute derived metrics.averageOrderValue using the user-scoped totals when possible
         pipeline.push({
            $addFields: {
               metrics: {
                  $let: {
                     vars: {
                        sTotal: { $ifNull: ['$totalSales', 0] },
                        pTotal: { $ifNull: ['$totalPurchases', 0] },
                        sCount: { $ifNull: ['$metrics.totalSalesOrders', 0] },
                        pCount: { $ifNull: ['$metrics.totalPurchaseOrders', 0] }
                     },
                     in: {
                        totalSalesOrders: '$$sCount',
                        totalPurchaseOrders: '$$pCount',
                        totalOrders: { $add: ['$$sCount', '$$pCount'] },
                        averageOrderValue: {
                           $cond: [ { $gt: [ { $add: ['$$sCount', '$$pCount'] }, 0 ] }, { $divide: [ { $add: ['$$sTotal', '$$pTotal'] }, { $add: ['$$sCount', '$$pCount'] } ] }, '$metrics.averageOrderValue' ]
                        },
                        onTimeDeliveryRate: '$metrics.onTimeDeliveryRate'
                     }
                  }
               }
            }
         });
      }

      // Optional projection: allow client to request only specific fields via `fields` query param
      // fields can be comma-separated list, e.g. fields=name,companyName,email
      const { fields } = req.query;
      let shouldProject = false;
      let projectStage = {};
      if (fields) {
         // support array or comma-separated string
         const fieldArray = Array.isArray(fields) ? fields : String(fields).split(',').map(f => f.trim()).filter(Boolean);
         // if client specified '*' or 'all', skip projection
         if (!(fieldArray.length === 1 && (fieldArray[0] === '*' || fieldArray[0] === 'all'))) {
            shouldProject = true;
            // always include _id by default
            projectStage._id = 1;
            fieldArray.forEach(f => {
               if (f === 'id') f = '_id';
               projectStage[f] = 1;
            });
            if (search && fieldArray.includes('searchScore')) projectStage.searchScore = { $meta: 'textScore' };
         }
      }

      // Count pipeline
      const countPipeline = [...pipeline, { $count: 'total' }];

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      pipeline.push({ $skip: skip }, { $limit: Number(limit) });

      // Apply projection if requested
      if (shouldProject) {
         pipeline.push({ $project: projectStage });
      }

      // Execute queries in parallel
      const [data, totalResult] = await Promise.all([
         SupplierCustomer.aggregate(pipeline),
         SupplierCustomer.aggregate(countPipeline)
      ]);

      const total = totalResult[0]?.total || 0;
      const totalPages = Math.ceil(total / Number(limit));

      const result = {
         data,
         pagination: {
            currentPage: Number(page),
            totalPages,
            totalCount: total,
            limit: Number(limit),
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1
         }
      };

      // Cache the result
      setCache(cacheKey, result);

      success(res, 'Data retrieved successfully', result);

   } catch (err) {
      logger.error('Error in getAllSupplierCustomers:', err);
      error(res, 'Failed to retrieve data', err);
   }
};

/**
 * Get supplier/customer by ID
 */
const getSupplierCustomerById = async (req, res) => {
   try {
      const { orgNo } = req.profile;
      const { id } = req.params;

      const cacheKey = getCacheKey(orgNo, 'detail', { id });
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
         return success(res, 'Details retrieved successfully (cached)', cachedData);
      }

      const contact = await SupplierCustomer.findOne({ _id: id, orgNo })
         .populate('createdBy', 'name email')
         .populate('updatedBy', 'name email')
         .lean();

      if (!contact) {
         return error(res, 'Contact not found', null, 404);
      }

      // Add computed fields
      contact.displayName = contact.companyName || contact.name;
      contact.totalTransactions = contact.totalPurchases + contact.totalSales;
      contact.creditUtilization = contact.creditLimit === 0 ? 0 : 
         ((Math.abs(contact.currentBalance) / contact.creditLimit) * 100).toFixed(2);
      contact.isOverdue = contact.currentBalance < 0;

      // Cache the result
      setCache(cacheKey, contact);

      success(res, 'Details retrieved successfully', contact);

   } catch (err) {
      logger.error('Error in getSupplierCustomerById:', err);
      error(res, 'Failed to retrieve details', err);
   }
};

/**
 * Create new supplier/customer
 */
const createSupplierCustomer = async (req, res) => {
   try {
      const { orgNo, _id: userId } = req.profile;
      
      const contactData = {
         ...req.body,
         orgNo,
         createdBy: userId,
         updatedBy: userId
      };

      const contact = new SupplierCustomer(contactData);
      await contact.save();

      // Clear relevant caches
      clearCachePattern(orgNo);

      logger.info(`New contact created: ${contact._id} by user: ${userId}`);
      success(res, 'Contact created successfully', contact, 201);

   } catch (err) {
      logger.error('Error in createSupplierCustomer:', err);
      
      if (err.code === 11000) {
         const field = Object.keys(err.keyPattern)[0];
         return error(res, `${field} already exists`, null, 400);
      }
      
      if (err.name === 'ValidationError') {
         const messages = Object.values(err.errors).map(e => e.message);
         return error(res, 'Validation failed', { messages }, 400);
      }
      
      error(res, 'Failed to create contact', err);
   }
};

/**
 * Update supplier/customer
 */
const updateSupplierCustomer = async (req, res) => {
   try {
      const { orgNo, _id: userId } = req.profile;
      const { id } = req.params;

      const updateData = {
         ...req.body,
         updatedBy: userId,
         updatedAt: new Date()
      };

      const contact = await SupplierCustomer.findOneAndUpdate(
         { _id: id, orgNo },
         updateData,
         { new: true, runValidators: true }
      );

      if (!contact) {
         return error(res, 'Contact not found', null, 404);
      }

      // Clear relevant caches
      clearCachePattern(orgNo);
      clearCachePattern(id);

      logger.info(`Contact updated: ${id} by user: ${userId}`);
      success(res, 'Contact updated successfully', contact);

   } catch (err) {
      logger.error('Error in updateSupplierCustomer:', err);
      
      if (err.code === 11000) {
         const field = Object.keys(err.keyPattern)[0];
         return error(res, `${field} already exists`, null, 400);
      }
      
      if (err.name === 'ValidationError') {
         const messages = Object.values(err.errors).map(e => e.message);
         return error(res, 'Validation failed', { messages }, 400);
      }
      
      error(res, 'Failed to update contact', err);
   }
};

/**
 * Delete supplier/customer (soft delete)
 */
const deleteSupplierCustomer = async (req, res) => {
   try {
      const { orgNo, _id: userId } = req.profile;
      const { id } = req.params;

      const contact = await SupplierCustomer.findOneAndUpdate(
         { _id: id, orgNo },
         { 
            status: 'inactive',
            updatedBy: userId,
            updatedAt: new Date()
         },
         { new: true }
      );

      if (!contact) {
         return error(res, 'Contact not found', null, 404);
      }

      // Clear relevant caches
      clearCachePattern(orgNo);
      clearCachePattern(id);

      logger.info(`Contact soft deleted: ${id} by user: ${userId}`);
      success(res, 'Contact deleted successfully', contact);

   } catch (err) {
      logger.error('Error in deleteSupplierCustomer:', err);
      error(res, 'Failed to delete contact', err);
   }
};

/**
 * Bulk operations
 */
const bulkOperations = async (req, res) => {
   try {
      const { orgNo, _id: userId } = req.profile;
      const { operation, ids, data } = req.body;

      if (!operation || !ids || !Array.isArray(ids) || ids.length === 0) {
         return error(res, 'Invalid bulk operation data', null, 400);
      }

      if (ids.length > 100) {
         return error(res, 'Maximum 100 items allowed per bulk operation', null, 400);
      }

      let result;
      
      switch (operation) {
         case 'updateStatus':
            result = await SupplierCustomer.updateMany(
               { _id: { $in: ids }, orgNo },
               { 
                  status: data.status,
                  updatedBy: userId,
                  updatedAt: new Date()
               }
            );
            break;

         case 'updateCategory':
            result = await SupplierCustomer.updateMany(
               { _id: { $in: ids }, orgNo },
               { 
                  category: data.category,
                  updatedBy: userId,
                  updatedAt: new Date()
               }
            );
            break;

         case 'addTags':
            result = await SupplierCustomer.updateMany(
               { _id: { $in: ids }, orgNo },
               { 
                  $addToSet: { tags: { $each: data.tags } },
                  updatedBy: userId,
                  updatedAt: new Date()
               }
            );
            break;

         case 'delete':
            result = await SupplierCustomer.updateMany(
               { _id: { $in: ids }, orgNo },
               { 
                  status: 'inactive',
                  updatedBy: userId,
                  updatedAt: new Date()
               }
            );
            break;

         default:
            return error(res, 'Invalid bulk operation', null, 400);
      }

      // Clear relevant caches
      clearCachePattern(orgNo);

      logger.info(`Bulk operation ${operation} performed on ${ids.length} contacts by user: ${userId}`);
      success(res, `Bulk ${operation} completed successfully`, {
         operation,
         affectedCount: result.modifiedCount,
         totalRequested: ids.length
      });

   } catch (err) {
      logger.error('Error in bulkOperations:', err);
      error(res, 'Failed to perform bulk operation', err);
   }
};

/**
 * Search supplier/customers
 */
const searchSupplierCustomers = async (req, res) => {
   try {
      const { orgNo } = req.profile;
      const { 
         q: searchTerm, 
         type, 
         limit = 20,
         includeInactive = false,
         category 
      } = req.query;

      if (!searchTerm) {
         return error(res, 'Search term is required', null, 400);
      }

      const cacheKey = getCacheKey(orgNo, CACHE_KEYS.SEARCH, {
         searchTerm, type, limit, includeInactive, category
      });

      const cachedData = getCache(cacheKey);
      if (cachedData) {
         return success(res, 'Search results retrieved successfully (cached)', cachedData);
      }

      const results = await SupplierCustomer.searchContacts(orgNo, searchTerm, {
         type,
         limit: Number(limit),
         includeInactive: includeInactive === 'true',
         category
      });

      // Cache the results
      setCache(cacheKey, results);

      success(res, 'Search completed successfully', {
         results,
         searchTerm,
         totalFound: results.length
      });

   } catch (err) {
      logger.error('Error in searchSupplierCustomers:', err);
      error(res, 'Search failed', err);
   }
};

/**
 * Get analytics
 */
const getAnalytics = async (req, res) => {
   try {
      const { orgNo } = req.profile;
      const { type } = req.query;

      const cacheKey = getCacheKey(orgNo, CACHE_KEYS.ANALYTICS, { type });
      const cachedData = getCache(cacheKey);
      const filter = { orgNo };
      
      
      if (cachedData) {
         return success(res, 'Analytics retrieved successfully (cached)', cachedData);
      }
      const userId = req.profile.id;
      const activerole = req.profile.activerole;
      const analytics = await SupplierCustomer.getAnalytics(orgNo, type);

      const result = {
         summary: analytics[0] || {},
         generatedAt: new Date()
      };

      // Cache the result
      // setCache(cacheKey, result);

      success(res, 'Analytics retrieved successfully', result);

   } catch (err) {
      logger.error('Error in getAnalytics:', err);
      error(res, 'Failed to retrieve analytics', err);
   }
};

/**
 * Update transaction metrics
 */
const updateTransactionMetrics = async (req, res) => {
   try {
      const { orgNo } = req.profile;
      const { id } = req.params;
      const { amount, type = 'purchase' } = req.body;

      if (!amount || amount <= 0) {
         return error(res, 'Valid amount is required', null, 400);
      }

      const contact = await SupplierCustomer.findOne({ _id: id, orgNo });
      
      if (!contact) {
         return error(res, 'Contact not found', null, 404);
      }

      await contact.updateTransactionMetrics(Number(amount), type);

      // Clear relevant caches
      clearCachePattern(orgNo);
      clearCachePattern(id);

      success(res, 'Transaction metrics updated successfully', contact);

   } catch (err) {
      logger.error('Error in updateTransactionMetrics:', err);
      error(res, 'Failed to update transaction metrics', err);
   }
};

module.exports = {
   getAllSupplierCustomers,
   getSupplierCustomerById,
   createSupplierCustomer,
   updateSupplierCustomer,
   deleteSupplierCustomer,
   bulkOperations,
   searchSupplierCustomers,
   getAnalytics,
   updateTransactionMetrics
};