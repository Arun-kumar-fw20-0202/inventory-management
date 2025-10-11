const { StockModal } = require("../../models/stock/stock-scheema");
const mongoose = require("mongoose");

// ============================
// CACHE MANAGEMENT
// ============================
const stockCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const getCacheKey = (orgNo, key, params = {}) => {
  return `${orgNo}:stock:${key}:${JSON.stringify(params)}`;
};

const setCache = (key, data, ttl = CACHE_TTL) => {
  stockCache.set(key, {
    data,
    expires: Date.now() + ttl
  });
};

const getCache = (key) => {
  const cached = stockCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  stockCache.delete(key);
  return null;
};

const clearOrgCache = (orgNo) => {
  for (const [key] of stockCache) {
    if (key.startsWith(`${orgNo}:stock:`)) {
      stockCache.delete(key);
    }
  }
};

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Build dynamic filter object for stock queries with enhanced filtering
 */
const buildStockFilter = (query, orgNo) => {
   const { 
     search, category, status, lowStock, minPrice, maxPrice, unit, tags,
     warehouse, location, supplier, minQuantity, maxQuantity, dateFrom, dateTo,
     profitMargin, outOfStock, expiryDate, barcode
   } = query;
   const filter = { orgNo };

   // Enhanced text search across multiple fields with relevance scoring
   if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
         { productName: searchRegex },
         { sku: searchRegex },
         // { category: searchRegex },
         { description: searchRegex },
         // { warehouse: searchRegex },
         // { location: searchRegex },
         // { supplier: searchRegex },
         // { barcode: searchRegex },
         // { tags: { $in: [searchRegex] } }
      ];
   }

   // Category filter - supports partial matching
   if (category && category !== 'all') {
      filter.category = { $regex: category, $options: "i" };
   }

   // Status filter with multiple status support
   if (status && status !== 'all') {
      if (Array.isArray(status)) {
         filter.status = { $in: status };
      } else {
         filter.status = status;
      }
   }

   // Warehouse filter
   if (warehouse && warehouse !== 'all') {
      filter.warehouse = { $regex: warehouse, $options: "i" };
   }

   // Location filter
   if (location && location !== 'all') {
      filter.location = { $regex: location, $options: "i" };
   }

   // Supplier filter
   if (supplier && supplier !== 'all') {
      filter.supplier = { $regex: supplier, $options: "i" };
   }

   // Unit filter
   if (unit && unit !== 'all') {
      filter.unit = unit;
   }

   // Tags filter with multiple tag support
   if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
   }

   // Barcode search
   if (barcode) {
      filter.barcode = { $regex: barcode, $options: "i" };
   }

   // Low stock filter using aggregation expression
   if (lowStock === "true") {
      filter.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
   }

   // Out of stock filter
   if (outOfStock === "true") {
      filter.quantity = { $lte: 0 };
   }

   // Price range filters
   if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
   }

   // Quantity range filters
   if (minQuantity !== undefined || maxQuantity !== undefined) {
      filter.quantity = {};
      if (minQuantity !== undefined) filter.quantity.$gte = Number(minQuantity);
      if (maxQuantity !== undefined) filter.quantity.$lte = Number(maxQuantity);
   }

   // Profit margin filter
   if (profitMargin) {
      const marginValue = Number(profitMargin);
      filter.$expr = {
         $gte: [
           { $subtract: ["$sellingPrice", "$purchasePrice"] },
           marginValue
         ]
      };
   }

   // Date range filters
   if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
   }

   // Expiry date filter
   if (expiryDate) {
      const targetDate = new Date(expiryDate);
      filter.expiryDate = { $lte: targetDate };
   }

   // Exclude archived items by default unless specifically requested
   if (status !== 'archived' && !Array.isArray(status)) {
      filter.status = { $ne: 'archived' };
   }

   return filter;
};

/**
 * Build sort object for stock queries with enhanced sorting options
 */
const buildSortObject = (sortBy = 'updatedAt', sortOrder = 'desc') => {
   const validSortFields = [
     'productName', 'sku', 'category', 'quantity', 'sellingPrice', 'purchasePrice', 
     'createdAt', 'updatedAt', 'warehouse', 'location', 'supplier', 'lowStockThreshold',
     'profitMargin', 'unit', 'status', 'expiryDate'
   ];
   const field = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
   const order = sortOrder === 'asc' ? 1 : -1;
   
   // Secondary sort by productName for consistent ordering
   return { [field]: order, productName: 1 };
};

/**
 * Calculate pagination info
 */
const calculatePagination = (page, limit, totalItems) => {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;
  const totalPages = Math.ceil(totalItems / limitNum);
  
  return {
    currentPage: pageNum,
    totalPages,
    totalItems,
    itemsPerPage: limitNum,
    hasNext: pageNum < totalPages,
    hasPrev: pageNum > 1,
    skip
  };
};

/**
 * Generate field selection object
 */
const buildFieldSelection = (fields) => {
  if (!fields) return {};
  
  const defaultFields = [
    'productName', 'sku', 'category', 'quantity', 'sellingPrice', 
    'purchasePrice', 'status', 'unit', 'warehouse', 'location',
    'lowStockThreshold', 'tags', 'createdAt', 'updatedAt'
  ];
  
  const requestedFields = fields.split(',').map(f => f.trim());
  const validFields = requestedFields.filter(f => defaultFields.includes(f));
  
  if (validFields.length === 0) return {};
  
  const selection = {};
  validFields.forEach(field => {
    selection[field] = 1;
  });
  
  return selection;
};

// ============================
// STOCK CONTROLLERS
// ============================

/**
 * CREATE STOCK - Enhanced with comprehensive validation and optimizations
 */
const createStockController = async (req, res) => {
   try {
      const { 
         productName, 
         sku, 
         category, 
         warehouse,
         location = '',
         supplier = '',
         description = '', 
         quantity, 
         unit = 'pcs', 
         purchasePrice, 
         sellingPrice, 
         lowStockThreshold = 5, 
         tags = [], 
         status = 'active',
         barcode = '',
         expiryDate = null,
         batchNumber = '',
         costCenter = '',
         notes = ''
      } = req.body;

      // Enhanced validation
      const requiredFields = { productName, sku, category, warehouse, quantity, purchasePrice, sellingPrice };
      const missingFields = Object.entries(requiredFields)
         .filter(([key, value]) => value === undefined || value === null || value === '')
         .map(([key]) => key);

      if (missingFields.length > 0) {
         return res.status(400).json({ 
            success: false,
            message: "Missing required fields",
            missingFields,
            required: ['productName', 'sku', 'category', 'warehouse', 'quantity', 'purchasePrice', 'sellingPrice']
         });
      }

      // Business logic validation
      if (Number(quantity) < 0) {
         return res.status(400).json({ 
            success: false,
            message: "Quantity cannot be negative" 
         });
      }

      if (Number(purchasePrice) < 0 || Number(sellingPrice) < 0) {
         return res.status(400).json({ 
            success: false,
            message: "Prices cannot be negative" 
         });
      }

      if (Number(sellingPrice) < Number(purchasePrice)) {
         return res.status(400).json({ 
            success: false,
            message: "Selling price cannot be less than purchase price",
            warning: "This will result in negative profit margin"
         });
      }

      // Check for existing SKU in organization (using index for performance)
      const existingStock = await StockModal.findOne({ 
         sku: sku.toUpperCase().trim(), 
         orgNo: req.profile.orgNo,
         status: { $ne: 'archived' }
      }).select('_id productName').lean();

      if (existingStock) {
         return res.status(400).json({ 
            success: false,
            message: "SKU already exists for this organization",
            conflictField: "sku",
            existingProduct: existingStock.productName
         });
      }

      // Check for duplicate barcode if provided
      if (barcode && barcode.trim()) {
         const existingBarcode = await StockModal.findOne({
            barcode: barcode.trim(),
            orgNo: req.profile.orgNo,
            status: { $ne: 'archived' }
         }).select('_id productName').lean();

         if (existingBarcode) {
            return res.status(400).json({
               success: false,
               message: "Barcode already exists for this organization",
               conflictField: "barcode",
               existingProduct: existingBarcode.productName
            });
         }
      }

      // Calculate profit metrics
      const profitMargin = Number(sellingPrice) - Number(purchasePrice);
      const profitPercentage = ((profitMargin / Number(purchasePrice)) * 100).toFixed(2);

      // Create stock item with enhanced data
      const stockData = {
         productName: productName.trim(),
         sku: sku.toUpperCase().trim(),
         category: category.trim(),
         warehouse: warehouse.trim(),
         location: location.trim(),
         supplier: supplier.trim(),
         description: description.trim(),
         quantity: Number(quantity),
         unit: unit.toLowerCase(),
         purchasePrice: Number(purchasePrice),
         sellingPrice: Number(sellingPrice),
         lowStockThreshold: Math.max(0, Number(lowStockThreshold)),
         tags: Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(Boolean) : [],
         status,
         barcode: barcode.trim(),
         batchNumber: batchNumber.trim(),
         costCenter: costCenter.trim(),
         notes: notes.trim(),
         orgNo: req.profile.orgNo,
         createdBy: req.profile._id,
         updatedBy: req.profile._id,
         // Computed fields
         profitMargin,
         profitPercentage: Number(profitPercentage),
         isLowStock: Number(quantity) <= Number(lowStockThreshold),
         lastStockUpdate: new Date()
      };

      // Add expiry date if provided
      if (expiryDate) {
         stockData.expiryDate = new Date(expiryDate);
      }

      const stock = await StockModal.create(stockData);

      // Clear cache for organization
      clearOrgCache(req.profile.orgNo);

      return res.status(201).json({
         success: true,
         message: "Stock created successfully", 
         data: {
            ...stock.toObject(),
            profitMargin,
            profitPercentage: Number(profitPercentage),
            isLowStock: Number(quantity) <= Number(lowStockThreshold)
         }
      });

   } catch (error) {
      console.error("❌ Create stock error:", error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
         const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
         }));
         return res.status(400).json({ 
            success: false,
            message: "Validation error", 
            errors 
         });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
         const duplicateField = Object.keys(error.keyPattern)[0];
         return res.status(400).json({
            success: false,
            message: `Duplicate ${duplicateField} found`,
            field: duplicateField
         });
      }

      return res.status(500).json({ 
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * UPDATE STOCK - Enhanced with comprehensive validation and optimizations
 */
const updateStockController = async (req, res) => {
   try {
      const { id } = req.params;
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ 
            success: false,
            message: "Invalid stock ID format" 
         });
      }

      // Get current stock data for comparison
      const currentStock = await StockModal.findOne({
         _id: id,
         orgNo: req.profile.orgNo
      }).lean();

      if (!currentStock) {
         return res.status(404).json({ 
            success: false,
            message: "Stock item not found" 
         });
      }

      // Remove fields that shouldn't be updated directly
      const { orgNo, createdBy, createdAt, _id, ...allowedUpdates } = req.body;
      
      // Validate business rules for updates
      if (allowedUpdates.quantity !== undefined && Number(allowedUpdates.quantity) < 0) {
         return res.status(400).json({
            success: false,
            message: "Quantity cannot be negative"
         });
      }

      if (allowedUpdates.purchasePrice !== undefined && Number(allowedUpdates.purchasePrice) < 0) {
         return res.status(400).json({
            success: false,
            message: "Purchase price cannot be negative"
         });
      }

      if (allowedUpdates.sellingPrice !== undefined && Number(allowedUpdates.sellingPrice) < 0) {
         return res.status(400).json({
            success: false,
            message: "Selling price cannot be negative"
         });
      }

      // Check profit margin if both prices are being updated
      const newPurchasePrice = allowedUpdates.purchasePrice || currentStock.purchasePrice;
      const newSellingPrice = allowedUpdates.sellingPrice || currentStock.sellingPrice;
      
      if (Number(newSellingPrice) < Number(newPurchasePrice)) {
         return res.status(400).json({
            success: false,
            message: "Selling price cannot be less than purchase price",
            warning: "This will result in negative profit margin"
         });
      }

      // Add updatedBy field and timestamp
      const updateData = { 
         ...allowedUpdates, 
         updatedBy: req.profile._id,
         lastStockUpdate: new Date()
      };

      // Transform and validate sku if provided
      if (updateData.sku) {
         updateData.sku = updateData.sku.toUpperCase().trim();
         
         // Check for SKU conflicts (excluding current item)
         const existingStock = await StockModal.findOne({ 
            sku: updateData.sku, 
            orgNo: req.profile.orgNo,
            _id: { $ne: id },
            status: { $ne: 'archived' }
         }).select('_id productName').lean();

         if (existingStock) {
            return res.status(400).json({ 
               success: false,
               message: "SKU already exists for this organization",
               conflictField: "sku",
               existingProduct: existingStock.productName
            });
         }
      }

      // Check barcode conflicts if provided
      if (updateData.barcode && updateData.barcode.trim()) {
         const existingBarcode = await StockModal.findOne({
            barcode: updateData.barcode.trim(),
            orgNo: req.profile.orgNo,
            _id: { $ne: id },
            status: { $ne: 'archived' }
         }).select('_id productName').lean();

         if (existingBarcode) {
            return res.status(400).json({
               success: false,
               message: "Barcode already exists for this organization",
               conflictField: "barcode",
               existingProduct: existingBarcode.productName
            });
         }
      }

      // Trim string fields
      const stringFields = ['productName', 'category', 'description', 'warehouse', 'location', 'supplier', 'notes', 'batchNumber', 'costCenter'];
      stringFields.forEach(field => {
         if (updateData[field] !== undefined) {
            updateData[field] = updateData[field].toString().trim();
         }
      });

      // Handle tags array
      if (updateData.tags) {
         updateData.tags = Array.isArray(updateData.tags) 
            ? updateData.tags.map(tag => tag.trim()).filter(Boolean)
            : [];
      }

      // Calculate computed fields if prices or quantity changed
      if (updateData.quantity !== undefined || updateData.purchasePrice !== undefined || updateData.sellingPrice !== undefined) {
         const finalQuantity = updateData.quantity !== undefined ? Number(updateData.quantity) : currentStock.quantity;
         const finalLowThreshold = updateData.lowStockThreshold !== undefined ? Number(updateData.lowStockThreshold) : currentStock.lowStockThreshold;
         const finalPurchasePrice = updateData.purchasePrice !== undefined ? Number(updateData.purchasePrice) : currentStock.purchasePrice;
         const finalSellingPrice = updateData.sellingPrice !== undefined ? Number(updateData.sellingPrice) : currentStock.sellingPrice;

         updateData.profitMargin = finalSellingPrice - finalPurchasePrice;
         updateData.profitPercentage = ((updateData.profitMargin / finalPurchasePrice) * 100).toFixed(2);
         updateData.isLowStock = finalQuantity <= finalLowThreshold;
      }

      // Handle expiry date
      if (updateData.expiryDate) {
         updateData.expiryDate = new Date(updateData.expiryDate);
      }

      // Perform update with validation
      const stock = await StockModal.findOneAndUpdate(
         { _id: id, orgNo: req.profile.orgNo },
         updateData,
         { 
            new: true, 
            runValidators: true,
            lean: false
         }
      );

      if (!stock) {
         return res.status(404).json({ 
            success: false,
            message: "Stock item not found" 
         });
      }

      // Clear cache for organization
      clearOrgCache(req.profile.orgNo);

      // Track quantity changes for audit
      if (updateData.quantity !== undefined && updateData.quantity !== currentStock.quantity) {
         console.log(`📊 Stock quantity updated: ${currentStock.productName} (${currentStock.sku}) from ${currentStock.quantity} to ${updateData.quantity} by user ${req.profile._id}`);
      }

      return res.json({
         success: true,
         data: stock, 
         message: "Stock updated successfully",
         changes: {
            quantityChanged: updateData.quantity !== undefined && updateData.quantity !== currentStock.quantity,
            priceChanged: (updateData.purchasePrice !== undefined && updateData.purchasePrice !== currentStock.purchasePrice) || 
                         (updateData.sellingPrice !== undefined && updateData.sellingPrice !== currentStock.sellingPrice)
         }
      });

   } catch (error) {
      console.error("❌ Update stock error:", error);
      
      if (error.name === 'ValidationError') {
         const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
         }));
         return res.status(400).json({ 
            success: false,
            message: "Validation error", 
            errors 
         });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
         const duplicateField = Object.keys(error.keyPattern)[0];
         return res.status(400).json({
            success: false,
            message: `Duplicate ${duplicateField} found`,
            field: duplicateField
         });
      }

      return res.status(500).json({ 
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * DELETE STOCK - Enhanced soft delete with transfer options
 */
const deleteStockController = async (req, res) => {
   try {
      const { id } = req.params;
      const { hard = false, reason = '' } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ 
            success: false,
            message: "Invalid stock ID format" 
         });
      }

      const stock = await StockModal.findOne({
         _id: id,
         orgNo: req.profile.orgNo
      }).lean();

      if (!stock) {
         return res.status(404).json({ 
            success: false,
            message: "Stock item not found" 
         });
      }

      let result;
      if (hard === 'true') {
         // Hard delete - permanently remove from database
         result = await StockModal.findOneAndDelete({
            _id: id,
            orgNo: req.profile.orgNo
         });
         
         console.log(`🗑️ Stock hard deleted: ${stock.productName} (${stock.sku}) by user ${req.profile._id}. Reason: ${reason}`);
      } else {
         // Soft delete - archive status
         result = await StockModal.findOneAndUpdate(
            { _id: id, orgNo: req.profile.orgNo },
            { 
               status: "archived", 
               updatedBy: req.profile._id,
               archivedAt: new Date(),
               archiveReason: reason || 'Manual deletion'
            },
            { new: true, lean: true }
         );

         console.log(`📦 Stock archived: ${stock.productName} (${stock.sku}) by user ${req.profile._id}. Reason: ${reason}`);
      }

      // Clear cache for organization
      clearOrgCache(req.profile.orgNo);

      return res.json({ 
         success: true,
         message: hard === 'true' ? "Stock permanently deleted" : "Stock archived successfully", 
         data: {
            id: stock._id,
            productName: stock.productName,
            sku: stock.sku,
            deleteType: hard === 'true' ? 'permanent' : 'archived',
            reason: reason || 'Manual deletion'
         }
      });

   } catch (error) {
      console.error("❌ Delete stock error:", error);
      return res.status(500).json({ 
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * GET STOCK BY ID - Enhanced with comprehensive data and caching
 */
const getStockByIdController = async (req, res) => {
   try {
      const { id } = req.params;
      const { includeHistory = false, includeAnalytics = false } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ 
            success: false,
            message: "Invalid stock ID format" 
         });
      }

      // Check cache first
      const cacheKey = getCacheKey(req.profile.orgNo, 'single', { id, includeHistory, includeAnalytics });
      let cachedData = getCache(cacheKey);
      
      if (cachedData) {
         return res.json({
            success: true,
            data: cachedData,
            cached: true,
            message: "Stock retrieved successfully"
         });
      }

      const stock = await StockModal.findOne({ 
         _id: id, 
         orgNo: req.profile.orgNo 
      })
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .lean();

      if (!stock) {
         return res.status(404).json({ 
            success: false,
            message: "Stock item not found" 
         });
      }

      // Add computed fields
      stock.isLowStock = stock.quantity <= stock.lowStockThreshold;
      stock.profitMargin = stock.sellingPrice - stock.purchasePrice;
      stock.profitPercentage = ((stock.profitMargin / stock.purchasePrice) * 100).toFixed(2);
      stock.totalValue = stock.quantity * stock.sellingPrice;
      stock.totalCost = stock.quantity * stock.purchasePrice;
      stock.isExpiringSoon = stock.expiryDate ? (new Date(stock.expiryDate) - new Date()) < (30 * 24 * 60 * 60 * 1000) : false; // 30 days
      stock.isExpired = stock.expiryDate ? new Date(stock.expiryDate) < new Date() : false;
      stock.stockStatus = stock.quantity <= 0 ? 'Out of Stock' : 
                         stock.isLowStock ? 'Low Stock' : 'In Stock';

      // Include stock history if requested
      if (includeHistory === 'true') {
         // You can implement stock movement history here
         stock.stockHistory = []; // Placeholder for stock movement history
      }

      // Include analytics if requested
      if (includeAnalytics === 'true') {
         const analytics = await StockModal.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id), orgNo: req.profile.orgNo } },
            {
               $lookup: {
                  from: 'stocks',
                  let: { category: '$category', orgNo: '$orgNo' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $and: [
                                 { $eq: ['$category', '$$category'] },
                                 { $eq: ['$orgNo', '$$orgNo'] },
                                 { $ne: ['$status', 'archived'] }
                              ]
                           }
                        }
                     },
                     {
                        $group: {
                           _id: null,
                           totalItems: { $sum: 1 },
                           totalQuantity: { $sum: '$quantity' },
                           avgPrice: { $avg: '$sellingPrice' },
                           totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
                        }
                     }
                  ],
                  as: 'categoryStats'
               }
            }
         ]);

         if (analytics.length > 0 && analytics[0].categoryStats.length > 0) {
            stock.categoryAnalytics = analytics[0].categoryStats[0];
         }
      }

      // Cache the result
      setCache(cacheKey, stock, 2 * 60 * 1000); // Cache for 2 minutes

      return res.json({
         success: true,
         data: stock, 
         message: "Stock retrieved successfully"
      });

   } catch (error) {
      console.error("❌ Get stock by ID error:", error);
      return res.status(500).json({ 
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * GET ALL STOCK - Highly optimized with advanced filtering and pagination
 */
/**
 * GET ALL STOCK - Highly optimized with advanced filtering, caching and analytics
 */
const getAllStockController = async (req, res) => {
   try {
      const { 
         page = 1, 
         limit = 20, 
         sortBy = 'updatedAt', 
         sortOrder = 'desc',
         fields,
         includeAnalytics = false,
         includeBreakdown= false,
         export: exportData = false
      } = req.query;

      // Check cache for common queries (exclude user-specific or real-time data)
      const cacheKey = getCacheKey(req.profile.orgNo, 'list', {
         page, limit, sortBy, sortOrder, fields, ...req.query
      });

      if (!exportData) {
         let cachedData = getCache(cacheKey);
         if (cachedData) {
            return res.json({
               success: true,
               ...cachedData,
               cached: true
            });
         }
      }

      // Build filter and sort objects
      const filter = buildStockFilter(req.query, req.profile.orgNo);
      const sort = buildSortObject(sortBy, sortOrder);
      const fieldSelection = buildFieldSelection(fields);

      // Get total count and paginated results in parallel for better performance
      const [totalItems, stocks] = await Promise.all([
         StockModal.countDocuments(filter),
         StockModal.find(filter, fieldSelection)
            .sort(sort)
            .limit(exportData === 'true' ? 0 : Math.min(100, Math.max(1, Number(limit))))
            .skip(exportData === 'true' ? 0 : calculatePagination(page, limit, 0).skip)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .populate('category', 'name')
            .populate('warehouse', 'name location')
            .lean()
      ]);

      // Calculate pagination info
      const pagination = calculatePagination(page, limit, totalItems);

      // Add computed fields to each stock item
      const enhancedStocks = stocks.map(stock => ({
         ...stock,
         isLowStock: stock.quantity <= stock.lowStockThreshold,
         profitMargin: stock.sellingPrice - stock.purchasePrice,
         profitPercentage: ((stock.sellingPrice - stock.purchasePrice) / stock.purchasePrice * 100).toFixed(2),
         totalValue: stock.quantity * stock.sellingPrice,
         totalCost: stock.quantity * stock.purchasePrice,
         stockStatus: stock.quantity <= 0 ? 'Out of Stock' : 
                     (stock.quantity <= stock.lowStockThreshold ? 'Low Stock' : 'In Stock'),
         isExpiringSoon: stock.expiryDate ? (new Date(stock.expiryDate) - new Date()) < (30 * 24 * 60 * 60 * 1000) : false,
         isExpired: stock.expiryDate ? new Date(stock.expiryDate) < new Date() : false
      }));

      // Prepare response data
      let responseData = {
         data: enhancedStocks,
         pagination: exportData === 'true' ? null : pagination,
         filters: {
            applied: Object.keys(req.query).length > 0,
            count: Object.keys(filter).length - 1 // Exclude orgNo
         }
      };

      // Include analytics if requested
      if (includeAnalytics === 'true') {
         const analytics = await Promise.all([
            // Summary statistics
            StockModal.aggregate([
               { $match: filter },
               {
                  $group: {
                     _id: null,
                     totalItems: { $sum: 1 },
                     totalQuantity: { $sum: '$quantity' },
                     totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
                     totalCost: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
                     averagePrice: { $avg: '$sellingPrice' },
                     lowStockCount: {
                        $sum: { $cond: [{ $lte: ['$quantity', '$lowStockThreshold'] }, 1, 0] }
                     },
                     outOfStockCount: {
                        $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
                     }
                  }
               }
            ]),
         ]);

         responseData.analytics = {
            summary: analytics[0][0] || {},
         };

         // Add profit analysis
         if (responseData.analytics.summary.totalValue && responseData.analytics.summary.totalCost) {
            responseData.analytics.summary.totalProfit = responseData.analytics.summary.totalValue - responseData.analytics.summary.totalCost;
            responseData.analytics.summary.profitMargin = ((responseData.analytics.summary.totalProfit / responseData.analytics.summary.totalCost) * 100).toFixed(2);
         }
      }

      if (includeBreakdown === 'true') {
         // Fetch lightweight breakdowns for category and warehouse (no summary)
         const [categoryBreakdown, warehouseBreakdown] = await Promise.all([
            StockModal.aggregate([
               { $match: filter },
               {
                  $group: {
                     _id: '$category',
                     count: { $sum: 1 },
                     totalQuantity: { $sum: '$quantity' },
                     totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
                     averagePrice: { $avg: '$sellingPrice' }
                  }
               },
               { $sort: { count: -1 } },
               { $limit: 10 },
               {
                 $lookup: {
                   from: 'categories',
                   localField: '_id',
                   foreignField: '_id',
                   as: 'categoryDoc'
                 }
               },
               { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
               {
                 $project: {
                   id: '$_id',
                   label: { $ifNull: ['$categoryDoc.name', 'Unassigned'] },
                   count: 1,
                   totalQuantity: 1,
                   totalValue: 1,
                   averagePrice: 1
                 }
               }
            ]),
            StockModal.aggregate([
               { $match: filter },
               {
                  $group: {
                     _id: '$warehouse',
                     count: { $sum: 1 },
                     totalQuantity: { $sum: '$quantity' },
                     totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
                  }
               },
               { $sort: { count: -1 } },
               { $limit: 10 },
               {
                 $lookup: {
                   from: 'warehouses',
                   localField: '_id',
                   foreignField: '_id',
                   as: 'warehouseDoc'
                 }
               },
               { $unwind: { path: '$warehouseDoc', preserveNullAndEmptyArrays: true } },
               {
                 $project: {
                   id: '$_id',
                   label: { $ifNull: ['$warehouseDoc.name', 'Unassigned'] },
                   location: '$warehouseDoc.location',
                   count: 1,
                   totalQuantity: 1,
                   totalValue: 1
                 }
               }
            ])
         ]);

         responseData.breakdown = {
            categoryBreakdown: categoryBreakdown || [],
            warehouseBreakdown: warehouseBreakdown || []
         };
      }
      
      // Cache the result if not exporting
      if (exportData !== 'true') {
         setCache(cacheKey, responseData, 1 * 60 * 1000); // Cache for 1 minute
      }

      // Handle export requests
      if (exportData === 'true') {
         responseData.exportInfo = {
            generatedAt: new Date(),
            totalRecords: enhancedStocks.length,
            format: 'json'
         };
      }

      return res.json({
         success: true,
         ...responseData,
         message: `Successfully retrieved ${enhancedStocks.length} stock items`
      });

   } catch (error) {
      console.error("❌ Get all stock error:", error);
      return res.status(500).json({ 
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * BULK UPDATE STOCK - Enhanced bulk operations with validation
 */
const bulkUpdateStockController = async (req, res) => {
   try {
      const { operations } = req.body;

      if (!Array.isArray(operations) || operations.length === 0) {
         return res.status(400).json({
            success: false,
            message: "Operations array is required and cannot be empty"
         });
      }

      if (operations.length > 100) {
         return res.status(400).json({
            success: false,
            message: "Maximum 100 operations allowed per bulk update"
         });
      }

      const results = {
         successful: [],
         failed: [],
         total: operations.length
      };

      // Process operations in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < operations.length; i += batchSize) {
         const batch = operations.slice(i, i + batchSize);
         
         const batchPromises = batch.map(async (operation) => {
            try {
               const { id, action, data } = operation;

               if (!mongoose.Types.ObjectId.isValid(id)) {
                  throw new Error(`Invalid stock ID: ${id}`);
               }

               let result;
               switch (action) {
                  case 'update':
                     result = await StockModal.findOneAndUpdate(
                        { _id: id, orgNo: req.profile.orgNo },
                        { ...data, updatedBy: req.profile._id, lastStockUpdate: new Date() },
                        { new: true, runValidators: true }
                     );
                     break;
                  case 'updateQuantity':
                     result = await StockModal.findOneAndUpdate(
                        { _id: id, orgNo: req.profile.orgNo },
                        { 
                           $inc: { quantity: data.quantityChange || 0 },
                           updatedBy: req.profile._id,
                           lastStockUpdate: new Date()
                        },
                        { new: true }
                     );
                     break;
                  case 'archive':
                     result = await StockModal.findOneAndUpdate(
                        { _id: id, orgNo: req.profile.orgNo },
                        { 
                           status: 'archived',
                           updatedBy: req.profile._id,
                           archivedAt: new Date(),
                           archiveReason: data.reason || 'Bulk operation'
                        },
                        { new: true }
                     );
                     break;
                  default:
                     throw new Error(`Unknown action: ${action}`);
               }

               if (!result) {
                  throw new Error(`Stock item not found: ${id}`);
               }

               results.successful.push({
                  id,
                  action,
                  result: result._id
               });

            } catch (error) {
               results.failed.push({
                  id: operation.id,
                  action: operation.action,
                  error: error.message
               });
            }
         });

         await Promise.allSettled(batchPromises);
      }

      // Clear cache after bulk operations
      clearOrgCache(req.profile.orgNo);

      return res.json({
         success: true,
         message: `Bulk operation completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
         data: results
      });

   } catch (error) {
      console.error("❌ Bulk update stock error:", error);
      return res.status(500).json({
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * SEARCH STOCK - Advanced search with relevance scoring
 */
const searchStockController = async (req, res) => {
   try {
      const { q: searchTerm, limit = 20, includeArchived = false } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
         return res.status(400).json({
            success: false,
            message: "Search term must be at least 2 characters long"
         });
      }

      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

      // Build search pipeline with relevance scoring
      const searchPipeline = [
         {
            $match: {
               orgNo: req.profile.orgNo,
               status: includeArchived === 'true' ? { $exists: true } : { $ne: 'archived' },
               $or: [
                  { productName: { $regex: searchTerm.trim(), $options: 'i' } },
                  { sku: { $regex: searchTerm.trim(), $options: 'i' } },
                  // { category: { $regex: searchTerm.trim(), $options: 'i' } },
                  { description: { $regex: searchTerm.trim(), $options: 'i' } },
                  // { warehouse: { $regex: searchTerm.trim(), $options: 'i' } },
                  // { supplier: { $regex: searchTerm.trim(), $options: 'i' } },
                  // { barcode: { $regex: searchTerm.trim(), $options: 'i' } },
                  // { tags: { $in: [{ $regex: searchTerm.trim(), $options: 'i' }] } }
               ]
            }
         },
         {
            $addFields: {
               relevanceScore: {
                  $add: [
                     // Exact match in productName gets highest score
                     { $cond: [{ $eq: [{ $toLower: '$productName' }, searchTerm.toLowerCase()] }, 100, 0] },
                     // Exact match in SKU gets high score
                     { $cond: [{ $eq: [{ $toLower: '$sku' }, searchTerm.toLowerCase()] }, 90, 0] },
                     // Starts with productName
                     { $cond: [{ $regexMatch: { input: '$productName', regex: `^${searchTerm}`, options: 'i' } }, 80, 0] },
                     // Starts with SKU
                     { $cond: [{ $regexMatch: { input: '$sku', regex: `^${searchTerm}`, options: 'i' } }, 70, 0] },
                     // Contains in productName
                     { $cond: [{ $regexMatch: { input: '$productName', regex: searchTerm, options: 'i' } }, 60, 0] },
                     // Contains in category
                     // { $cond: [{ $regexMatch: { input: '$category', regex: searchTerm, options: 'i' } }, 40, 0] },
                     // Contains in description
                     { $cond: [{ $regexMatch: { input: '$description', regex: searchTerm, options: 'i' } }, 30, 0] },
                     // Contains in other fields
                     // { $cond: [{ $regexMatch: { input: '$warehouse', regex: searchTerm, options: 'i' } }, 20, 0] }
                  ]
               },
               isLowStock: { $lte: ['$quantity', '$lowStockThreshold'] },
               profitMargin: { $subtract: ['$sellingPrice', '$purchasePrice'] },
               totalValue: { $multiply: ['$quantity', '$sellingPrice'] }
            }
         },
         { $sort: { relevanceScore: -1, updatedAt: -1 } },
         { $limit: limitNum },
         {
            $project: {
               productName: 1,
               sku: 1,
               category: 1,
               warehouse: 1,
               quantity: 1,
               sellingPrice: 1,
               purchasePrice: 1,
               status: 1,
               unit: 1,
               isLowStock: 1,
               profitMargin: 1,
               totalValue: 1,
               relevanceScore: 1,
               updatedAt: 1
            }
         }
      ];

      const searchResults = await StockModal.aggregate(searchPipeline);

      return res.json({
         success: true,
         data: searchResults,
         searchTerm: searchTerm.trim(),
         totalResults: searchResults.length,
         message: `Found ${searchResults.length} items matching "${searchTerm}"`
      });

   } catch (error) {
      console.error("❌ Search stock error:", error);
      return res.status(500).json({
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * GET LOW STOCK ALERTS - Optimized low stock detection
 */
const getLowStockAlertsController = async (req, res) => {
   try {
      const { limit = 50, includeZeroStock = true } = req.query;

      // Check cache first
      const cacheKey = getCacheKey(req.profile.orgNo, 'lowStock', { limit, includeZeroStock });
      let cachedData = getCache(cacheKey);
      
      if (cachedData) {
         return res.json({
            success: true,
            data: cachedData,
            cached: true,
            message: "Low stock alerts retrieved from cache"
         });
      }

      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      // Build aggregation pipeline for low stock detection
      const pipeline = [
         {
            $match: {
               orgNo: req.profile.orgNo,
               status: 'active',
               $expr: includeZeroStock === 'true' 
                  ? { $lte: ['$quantity', '$lowStockThreshold'] }
                  : { $and: [{ $lte: ['$quantity', '$lowStockThreshold'] }, { $gt: ['$quantity', 0] }] }
            }
         },
         {
            $addFields: {
               urgencyLevel: {
                     $switch: {
                        branches: [
                           { case: { $eq: ['$quantity', 0] }, then: 'critical' },
                           { case: { $lte: ['$quantity', { $multiply: ['$lowStockThreshold', 0.5] }] }, then: 'high' }
                        ],
                        default: 'medium'
                     }
               },
               daysOfStock: {
                  $cond: [
                     { $gt: ['$averageDailySales', 0] },
                     { $divide: ['$quantity', '$averageDailySales'] },
                     null
                  ]
               },
               shortfall: { $subtract: ['$lowStockThreshold', '$quantity'] }
            }
         },
         {
            $sort: {
               quantity: 1,
               lowStockThreshold: -1,
               updatedAt: -1
            }
         },
         { $limit: limitNum },
         {
            $project: {
               productName: 1,
               sku: 1,
               category: 1,
               warehouse: 1,
               quantity: 1,
               lowStockThreshold: 1,
               sellingPrice: 1,
               supplier: 1,
               urgencyLevel: 1,
               daysOfStock: 1,
               shortfall: 1,
               totalValue: { $multiply: ['$quantity', '$sellingPrice'] },
               lastStockUpdate: 1
            }
         }
      ];

      const lowStockItems = await StockModal.aggregate(pipeline);

      // Group by urgency level
      const groupedAlerts = {
         critical: lowStockItems.filter(item => item.urgencyLevel === 'critical'),
         high: lowStockItems.filter(item => item.urgencyLevel === 'high'),
         medium: lowStockItems.filter(item => item.urgencyLevel === 'medium')
      };

      const result = {
         items: lowStockItems,
         grouped: groupedAlerts,
         summary: {
            total: lowStockItems.length,
            critical: groupedAlerts.critical.length,
            high: groupedAlerts.high.length,
            medium: groupedAlerts.medium.length,
            totalShortfall: lowStockItems.reduce((sum, item) => sum + (item.shortfall || 0), 0)
         },
         generatedAt: new Date()
      };

      // Cache for 2 minutes (low stock data should be relatively fresh)
      setCache(cacheKey, result, 2 * 60 * 1000);

      return res.json({
         success: true,
         data: result,
         message: `Found ${lowStockItems.length} items with low stock`
      });

   } catch (error) {
      console.error("❌ Get low stock alerts error:", error);
      return res.status(500).json({
         success: false,
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * GET STOCK ANALYTICS - Enhanced comprehensive analytics with aggregation pipeline
 */
const getStockAnalyticsController = async (req, res) => {
   try {
      const orgNo = req.profile.orgNo;

      console.log({profile: req.profile})
      
      // Use aggregation pipeline for efficient analytics calculation
      const analyticsResult = await StockModal.aggregate([
         {
            $match: { 
               orgNo,
               status: { $ne: 'archived' }
            }
         },
         {
            $group: {
               _id: null,
               totalItems: { $sum: 1 },
               totalQuantity: { $sum: "$quantity" },
               totalPurchaseValue: { $sum: { $multiply: ["$quantity", "$purchasePrice"] } },
               totalSellingValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
               averageSellingPrice: { $avg: "$sellingPrice" },
               averagePurchasePrice: { $avg: "$purchasePrice" },
               lowStockItems: {
                  $sum: {
                     $cond: [
                        { $lte: ["$quantity", "$lowStockThreshold"] },
                        1,
                        0
                     ]
                  }
               },
               outOfStockItems: {
                  $sum: {
                     $cond: [
                        { $eq: ["$quantity", 0] },
                        1,
                        0
                     ]
                  }
               },
               activeItems: {
                  $sum: {
                     $cond: [
                        { $eq: ["$status", "active"] },
                        1,
                        0
                     ]
                  }
               },
               inactiveItems: {
                  $sum: {
                     $cond: [
                        { $eq: ["$status", "inactive"] },
                        1,
                        0
                     ]
                  }
               }
            }
         }
      ]);

      // Category-wise analytics
      const categoryAnalytics = await StockModal.aggregate([
         {
            $match: { 
               orgNo,
               status: { $ne: 'archived' }
            }
         },
         {
            $group: {
               _id: "$category",
               itemCount: { $sum: 1 },
               totalQuantity: { $sum: "$quantity" },
               totalValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
               averagePrice: { $avg: "$sellingPrice" }
            }
         },
         {
            $sort: { totalValue: -1 }
         },
         {
            $limit: 10
         }
      ]);

      // Unit-wise analytics
      const unitAnalytics = await StockModal.aggregate([
         {
            $match: { 
               orgNo,
               status: { $ne: 'archived' }
            }
         },
         {
            $group: {
               _id: "$unit",
               itemCount: { $sum: 1 },
               totalQuantity: { $sum: "$quantity" }
            }
         }
      ]);

      // Top valuable items - compute total value and sort using aggregation
      const topValueItems = await StockModal.aggregate([
         { $match: { orgNo, status: { $ne: 'archived' } } },
         {
            $project: {
               productName: 1,
               sku: 1,
               quantity: 1,
               sellingPrice: 1,
               purchasePrice: 1,
               totalValue: { $multiply: ["$quantity", "$sellingPrice"] }
            }
         },
         { $sort: { totalValue: -1 } },
         { $limit: 10 }
      ]);

      // Low stock alerts
      const lowStockAlerts = await StockModal.find({
         orgNo,
         status: 'active',
         $expr: { $lte: ["$quantity", "$lowStockThreshold"] }
      })
      .select('productName sku quantity lowStockThreshold')
      .sort({ quantity: 1 })
      .lean();

      const analytics = analyticsResult[0] || {
         totalItems: 0,
         totalQuantity: 0,
         totalPurchaseValue: 0,
         totalSellingValue: 0,
         averageSellingPrice: 0,
         averagePurchasePrice: 0,
         lowStockItems: 0,
         outOfStockItems: 0,
         activeItems: 0,
         inactiveItems: 0
      };

      // Calculate derived metrics
      analytics.potentialProfit = analytics.totalSellingValue - analytics.totalPurchaseValue;
      analytics.profitMarginPercentage = analytics.totalPurchaseValue > 0 
         ? ((analytics.potentialProfit / analytics.totalPurchaseValue) * 100).toFixed(2)
         : 0;
      analytics.lowStockPercentage = analytics.totalItems > 0 
         ? ((analytics.lowStockItems / analytics.totalItems) * 100).toFixed(2)
         : 0;

      return res.json({
         success: true,
         message: "Stock analytics retrieved successfully",
         data: {
            overview: analytics,
            categoryBreakdown: categoryAnalytics,
            unitBreakdown: unitAnalytics,
            topValueItems,
            lowStockAlerts,
            generatedAt: new Date()
         }
      });

   } catch (error) {
      console.error("❌ Stock analytics error:", error);
      return res.status(500).json({ 
         message: "Internal server error",
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

module.exports = {
   createStockController,
   updateStockController,
   deleteStockController,
   getStockByIdController,
   getAllStockController,
   bulkUpdateStockController,
   searchStockController,
   getLowStockAlertsController,
   getStockAnalyticsController,
};