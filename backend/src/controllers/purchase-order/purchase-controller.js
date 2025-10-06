const { PurchaseOrderModal } = require('../../models/purchase-order/purchase-order-scheema');
const { WherehouseModel } = require('../../models/warehouse/wherehouse-model');
const { StockModal } = require('../../models/stock/stock-scheema');
const { Product } = require('../../models/Product');
const { success, error } = require('../../utils/response');
const mongoose = require('mongoose');

/**
 * Generate unique order number
 */
const generateOrderNumber = async () => {
   const lastOrder = await PurchaseOrderModal.findOne()
      .sort({ createdAt: -1 })
      .select('orderNumber')
      .lean();
   
   if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace('PO', ''), 10);
      return `PO${String(lastNumber + 1).padStart(6, '0')}`;
   }
   return 'PO000001';
};

/**
 * Validate purchase order items
 */
const validateItems = async (items) => {
   if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required and cannot be empty');
   }

   const productIds = items.map(item => item.productId);
   const products = await StockModal.find({ _id: { $in: productIds } }).lean();
   
   if (products.length !== productIds.length) {
      throw new Error('One or more products not found');
   }

   // Validate each item
   items.forEach(item => {
      if (!item.productId || !item.quantity || !item.unitPrice) {
         throw new Error('Each item must have productId, quantity, and unitPrice');
      }
      if (item.quantity < 1) {
         throw new Error('Quantity must be at least 1');
      }
      if (item.unitPrice < 0) {
         throw new Error('Unit price cannot be negative');
      }
   });

   return products;
};

/**
 * Create a new purchase order
 */
const createPurchaseOrder = async (req, res) => {
   try {
      const { supplierId, warehouseId, items, expectedDeliveryDate, notes } = req.body;
      const userId = req.profile.id;

      console.log('Create purchase order request body:', req.body);

      // Validate required fields
      if (!supplierId || !warehouseId || !items) {
         return error(res, 'SupplierId, warehouseId, and items are required', null, 400);
      }

      // Validate items and get product details
      await validateItems(items);

      // Verify warehouse exists
      const warehouse = await WherehouseModel.findById(warehouseId).lean();
      if (!warehouse) {
         return error(res, 'Warehouse not found', null, 404);
      }

      // Generate unique order number
      const orderNumber = await generateOrderNumber();

      // Prepare items with calculated totals
      const processedItems = items.map(item => ({
         productId: item.productId,
         quantity: item.quantity,
         unitPrice: item.unitPrice,
         total: item.quantity * item.unitPrice,
         receivedQuantity: 0
      }));

      // Create purchase order
      const purchaseOrder = new PurchaseOrderModal({
         supplierId,
         warehouseId,
         orderNumber,
         items: processedItems,
         expectedDeliveryDate,
         notes,
         totalAmount: processedItems.reduce((sum, item) => sum + item.total, 0),
         createdBy: userId,
         status: 'Draft'
      });

      await purchaseOrder.save();

      // Populate related data for response
      const populatedOrder = await PurchaseOrderModal.findById(purchaseOrder._id)
         .populate('supplierId', 'name email')
         .populate('warehouseId', 'name location')
         .populate('createdBy', 'name email')
         .populate('items.productId', 'name sku')
         .lean();

      return success(res, 'Purchase order created successfully', populatedOrder, 201);

   } catch (err) {
      console.error('Create purchase order error:', err);
      return error(res, err.message || 'Failed to create purchase order', err, 500);
   }
};

/**
 * Submit purchase order for approval
 */
const submitPurchaseOrder = async (req, res) => {
   try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return error(res, 'Invalid purchase order ID', null, 400);
      }

      const purchaseOrder = await PurchaseOrderModal.findById(id);
      if (!purchaseOrder) {
         return error(res, 'Purchase order not found', null, 404);
      }

      if (purchaseOrder.status !== 'Draft') {
         return error(res, 'Only draft purchase orders can be submitted', null, 400);
      }

      purchaseOrder.status = 'PendingApproval';
      await purchaseOrder.save();

      return success(res, 'Purchase order submitted for approval', { 
         id: purchaseOrder._id, 
         status: purchaseOrder.status 
      });

   } catch (err) {
      console.error('Submit purchase order error:', err);
      return error(res, 'Failed to submit purchase order', err, 500);
   }
};

/**
 * Approve purchase order
 */
const approvePurchaseOrder = async (req, res) => {
   try {
      const { id } = req.params;
      const userId = req.profile.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return error(res, 'Invalid purchase order ID', null, 400);
      }

      const purchaseOrder = await PurchaseOrderModal.findById(id);
      if (!purchaseOrder) {
         return error(res, 'Purchase order not found', null, 404);
      }

      if (purchaseOrder.status !== 'PendingApproval') {
         return error(res, 'Only pending purchase orders can be approved', null, 400);
      }

      purchaseOrder.status = 'Approved';
      purchaseOrder.approvedBy = userId;
      await purchaseOrder.save();

      return success(res, 'Purchase order approved successfully', { 
         id: purchaseOrder._id, 
         status: purchaseOrder.status,
         approvedBy: userId
      });

   } catch (err) {
      console.error('Approve purchase order error:', err);
      return error(res, 'Failed to approve purchase order', err, 500);
   }
};

/**
 * Reject purchase order
 */
const rejectPurchaseOrder = async (req, res) => {
   try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return error(res, 'Invalid purchase order ID', null, 400);
      }

      const purchaseOrder = await PurchaseOrderModal.findById(id);
      if (!purchaseOrder) {
         return error(res, 'Purchase order not found', null, 404);
      }

      if (purchaseOrder.status !== 'PendingApproval') {
         return error(res, 'Only pending purchase orders can be rejected', null, 400);
      }

      purchaseOrder.status = 'Cancelled';
      if (reason) {
         purchaseOrder.notes = purchaseOrder.notes ? 
            `${purchaseOrder.notes}\n\nRejection Reason: ${reason}` : 
            `Rejection Reason: ${reason}`;
      }
      await purchaseOrder.save();

      return success(res, 'Purchase order rejected successfully', { 
         id: purchaseOrder._id, 
         status: purchaseOrder.status 
      });

   } catch (err) {
      console.error('Reject purchase order error:', err);
      return error(res, 'Failed to reject purchase order', err, 500);
   }
};

/**
 * Receive purchase order items and update stock
 */
const receivePurchaseOrder = async (req, res) => {
   const session = await mongoose.startSession();
   
   try {
      await session.withTransaction(async () => {
         const { id } = req.params;
         const { receivedItems } = req.body; // Array of { productId, receivedQuantity }

         if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid purchase order ID');
         }

         if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
            throw new Error('Received items array is required');
         }

         const purchaseOrder = await PurchaseOrderModal.findById(id).session(session);
         if (!purchaseOrder) {
            throw new Error('Purchase order not found');
         }

         if (purchaseOrder.status !== 'Approved' && purchaseOrder.status !== 'PartiallyReceived') {
            throw new Error('Only approved or partially received orders can receive items');
         }

         // Validate received quantities
         const updatedItems = [...purchaseOrder.items];
         const stockUpdates = [];

         for (const receivedItem of receivedItems) {
            const orderItem = updatedItems.find(item => 
               item.productId.toString() === receivedItem.productId.toString()
            );

            if (!orderItem) {
               throw new Error(`Product ${receivedItem.productId} not found in purchase order`);
            }

            const maxReceivable = orderItem.quantity - orderItem.receivedQuantity;
            if (receivedItem.receivedQuantity > maxReceivable) {
               throw new Error(`Cannot receive ${receivedItem.receivedQuantity} items. Maximum receivable: ${maxReceivable}`);
            }

            if (receivedItem.receivedQuantity > 0) {
               orderItem.receivedQuantity += receivedItem.receivedQuantity;
               
               // Prepare stock update
               stockUpdates.push({
                  updateOne: {
                     // Stock documents use _id for the stock record; use _id + warehouse to locate the record
                     filter: { 
                        _id: receivedItem.productId,
                        warehouse: purchaseOrder.warehouseId 
                     },
                     update: { 
                        $inc: { quantity: receivedItem.receivedQuantity } 
                     },
                     upsert: false
                  }
               });
            }
         }

         // Update stock using bulkWrite for performance
         if (stockUpdates.length > 0) {
            await StockModal.bulkWrite(stockUpdates, { session });
         }

         // Update purchase order items
         purchaseOrder.items = updatedItems;

         // Check if all items are fully received
         const allItemsReceived = purchaseOrder.items.every(item => 
            item.receivedQuantity >= item.quantity
         );

         purchaseOrder.status = allItemsReceived ? 'Completed' : 'PartiallyReceived';
         await purchaseOrder.save({ session });

         return success(res, 'Items received successfully', { 
            id: purchaseOrder._id, 
            status: purchaseOrder.status,
            receivedItems: receivedItems.length
         });
      });

   } catch (err) {
      console.error('Receive purchase order error:', err);
      return error(res, err.message || 'Failed to receive purchase order items', err, 500);
   } finally {
      await session.endSession();
   }
};

/**
 * Get paginated list of purchase orders with filters
 */
const getPurchaseOrders = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 10,
         status,
         supplierId,
         warehouseId,
         startDate,
         endDate,
         search
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filter = {};

      if (status) filter.status = status;
      if (supplierId) filter.supplierId = supplierId;
      if (warehouseId) filter.warehouseId = warehouseId;

      if (startDate || endDate) {
         filter.createdAt = {};
         if (startDate) filter.createdAt.$gte = new Date(startDate);
         if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      if (search) {
         filter.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
         ];
      }

      // Execute queries in parallel
      const [orders, totalCount] = await Promise.all([
         PurchaseOrderModal.find(filter)
            .populate('supplierId', 'name email')
            .populate('warehouseId', 'name location')
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
         PurchaseOrderModal.countDocuments(filter)
      ]);

      const pagination = {
         currentPage: pageNum,
         totalPages: Math.ceil(totalCount / limitNum),
         totalItems: totalCount,
         itemsPerPage: limitNum,
         hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
         hasPrevPage: pageNum > 1
      };

      return success(res, 'Purchase orders retrieved successfully', {
         orders,
         pagination
      });

   } catch (err) {
      console.error('Get purchase orders error:', err);
      return error(res, 'Failed to retrieve purchase orders', err, 500);
   }
};

/**
 * Get purchase order by ID with full details
 */
const getPurchaseOrderById = async (req, res) => {
   try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
         return error(res, 'Invalid purchase order ID', null, 400);
      }

      const purchaseOrder = await PurchaseOrderModal.findById(id)
         .populate('supplierId', 'name email phone address')
         .populate('warehouseId', 'name location')
         .populate('createdBy', 'name email')
         .populate('approvedBy', 'name email')
         .populate('items.productId', 'productName sku description')
         .lean();

      if (!purchaseOrder) {
         return error(res, 'Purchase order not found', null, 404);
      }

      return success(res, 'Purchase order retrieved successfully', purchaseOrder);

   } catch (err) {
      console.error('Get purchase order by ID error:', err);
      return error(res, 'Failed to retrieve purchase order', err, 500);
   }
};

module.exports = {
   createPurchaseOrder,
   submitPurchaseOrder,
   approvePurchaseOrder,
   rejectPurchaseOrder,
   receivePurchaseOrder,
   getPurchaseOrders,
   getPurchaseOrderById
};
