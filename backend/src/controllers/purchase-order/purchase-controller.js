const { PurchaseOrderModal } = require('../../models/purchase-order/purchase-order-scheema');
const { WherehouseModel } = require('../../models/warehouse/wherehouse-model');
const { StockModal } = require('../../models/stock/stock-scheema');
const { success, error } = require('../../utils/response');
const mongoose = require('mongoose');
const SuppliserCustomerModel = require('../../models/supplier/supplier-customer-scheema');
const { sendNotification } = require('../../utils/notification-service');
const { UserModal } = require('../../models/User');

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
         orgNo: req.profile.orgNo,
         status: 'Draft'
      });

      await purchaseOrder.save();

         // Notify on creation according to role rules:
         // - staff -> notify admin + managers
         // - manager -> notify admin
         // - admin -> no notification (already a top-level user)
         (async () => {
            try {
               const actorRole = req.profile?.activerole || 'staff';
               const actorName = req.profile?.name || 'A user';
               const orderNo = purchaseOrder.orderNumber || String(purchaseOrder._id);
               const payload = {
                  orgNo: req.profile.orgNo,
                  title: `Purchase order created: ${orderNo}`,
                  message: `${actorName} created a purchase order (${orderNo}).`,
                  type: 'purchase:created',
                  action: { url: `/purchase-orders/${purchaseOrder._id}` },
                  relatedEntity: { entityType: 'PURCHASE_ORDER', entityId: purchaseOrder._id },
                  metadata: { actor: { id: req.profile._id || req.profile.id, name: actorName, role: actorRole }, target: { id: purchaseOrder.createdBy } }
               };

               if (actorRole === 'staff') {
                  // notify managers and admins (exclude actor)
                  await sendNotification({ orgNo: req.profile.orgNo, roles: ['manager', 'admin'], excludeIds: [req.profile._id || req.profile.id], payload, includeAdmins: false });
               } else if (actorRole === 'manager') {
                  // notify admins only
                  await sendNotification({ orgNo: req.profile.orgNo, roles: ['admin'], excludeIds: [req.profile._id || req.profile.id], payload, includeAdmins: false });
               }
            } catch (e) {
               console.error('Notify on create purchase order failed', e);
            }
         })();

      // Populate related data for response
      const populatedOrder = await PurchaseOrderModal.findById(purchaseOrder._id)
         .populate('supplierId', 'name email phone')
         .populate('warehouseId', 'name location')
         .populate('createdBy', 'name email phone')
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

      // Notify approvers (manager/admin) depending on submitter role
      (async () => {
         try {
            const submitterRole = req.profile?.activerole || 'staff';
            const recipientRoles = [];
            if (submitterRole === 'manager') {
               recipientRoles.push('admin');
            } else {
               recipientRoles.push('manager', 'admin');
            }

            // resolve recipients
            const recipients = await UserModal.find({ orgNo: req.profile.orgNo, activerole: { $in: recipientRoles }, block_status: false }).select('_id').lean();
            const recipientIds = recipients.map(r => r._id).filter(Boolean);
            if (recipientIds.length > 0) {
               const title = `Purchase order submitted: ${purchaseOrder.orderNumber || purchaseOrder._id}`;
               const message = `${req.profile.name || 'A user'} has submitted a purchase order (${purchaseOrder.orderNumber || ''}). Please review and approve.`;
               await sendNotification({ orgNo: req.profile.orgNo, userIds: recipientIds, excludeIds: [req.profile._id || req.profile.id], payload: { orgNo: req.profile.orgNo, title, message, type: 'purchase:submitted', action: { url: `/purchase-orders/${purchaseOrder._id}` } }, includeAdmins: true });
            }
         } catch (e) {
            console.error('Notify on submit purchase order failed', e);
         }
      })();

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

      // Notify creator and admins about approval
      (async () => {
         try {
            const creatorId = purchaseOrder.createdBy;
            if (creatorId) {
               let creator = null;
               try { creator = await UserModal.findById(creatorId).select('name activerole').lean(); } catch(e) { console.warn('Failed to load creator for PO approval notification', e); }
               const approverName = req.profile?.name || 'A user';
               const creatorName = creator?.name || 'a user';
               const orderNo = purchaseOrder.orderNumber || String(purchaseOrder._id);

               const payloadCreator = {
                  orgNo: purchaseOrder.orgNo,
                  title: `Purchase order approved: ${orderNo}`,
                  message: `${approverName} approved your purchase order (${orderNo}).`,
                  type: 'purchase:approved',
                  action: { url: `/purchase-orders/${purchaseOrder._id}` },
                  relatedEntity: { entityType: 'PURCHASE_ORDER', entityId: purchaseOrder._id },
                  metadata: { actor: { id: req.profile._id || req.profile.id, name: approverName, role: req.profile?.activerole }, target: { id: creatorId, name: creatorName } }
               };
               await sendNotification({ orgNo: purchaseOrder.orgNo, userIds: [creatorId], includeAdmins: false, payload: payloadCreator });

               const payloadAdmin = { ...payloadCreator, type: 'purchase:approved:admin', message: `${approverName} approved ${creatorName}'s purchase order (${orderNo}).` };
               await sendNotification({ orgNo: purchaseOrder.orgNo, roles: ['admin'], includeAdmins: false, payload: payloadAdmin });
            }
         } catch (e) { console.error('Notify on approve purchase order failed', e); }
      })();

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

      // Notify creator and admins about rejection
      (async () => {
         try {
            const creatorId = purchaseOrder.createdBy;
            if (creatorId) {
               let creator = null;
               try { creator = await UserModal.findById(creatorId).select('name activerole').lean(); } catch(e) { console.warn('Failed to load creator for PO rejection notification', e); }
               const actorName = req.profile?.name || 'A user';
               const creatorName = creator?.name || 'a user';
               const orderNo = purchaseOrder.orderNumber || String(purchaseOrder._id);

               const payloadCreator = {
                  orgNo: purchaseOrder.orgNo,
                  title: `Purchase order rejected: ${orderNo}`,
                  message: `${actorName} rejected your purchase order (${orderNo})${reason ? ` Reason: ${reason}` : ''}`,
                  type: 'purchase:rejected',
                  action: { url: `/purchase-orders/${purchaseOrder._id}` },
                  relatedEntity: { entityType: 'PURCHASE_ORDER', entityId: purchaseOrder._id },
                  metadata: { actor: { id: req.profile._id || req.profile.id, name: actorName, role: req.profile?.activerole }, target: { id: creatorId, name: creatorName }, reason }
               };
               await sendNotification({ orgNo: purchaseOrder.orgNo, userIds: [creatorId], includeAdmins: false, payload: payloadCreator });

               const payloadAdmin = { ...payloadCreator, type: 'purchase:rejected:admin', message: `${actorName} rejected ${creatorName}'s purchase order (${orderNo})${reason ? ` Reason: ${reason}` : ''}` };
               await sendNotification({ orgNo: purchaseOrder.orgNo, roles: ['admin'], includeAdmins: false, payload: payloadAdmin });
            }
         } catch (e) { console.error('Notify on reject purchase order failed', e); }
      })();

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

         // update supplier `totalPurchases` amount count and transaction metrics
         // compute total amount received for this batch
         const totalReceivedAmount = receivedItems.reduce((sum, item) => {
            const orderItem = purchaseOrder.items.find(i => i.productId.toString() === item.productId.toString());
            const unitPrice = orderItem?.unitPrice || 0;
            return sum + (item.receivedQuantity * unitPrice);
         }, 0);

         if (totalReceivedAmount > 0) {
            try {
               // Atomic update using aggregation pipeline to minimize DB round-trips
               await SuppliserCustomerModel.findOneAndUpdate(
                  { _id: purchaseOrder.supplierId, orgNo: purchaseOrder.orgNo },
                  [
                     {
                        $set: {
                           totalPurchases: { $add: ["$totalPurchases", Number(totalReceivedAmount)] },
                           lastPurchaseAmount: Number(totalReceivedAmount),
                           lastTransactionDate: new Date(),
                           "metrics.totalOrders": { $add: ["$metrics.totalOrders", 1] },
                           "metrics.totalPurchaseOrders": { $add: ["$metrics.totalPurchaseOrders", 1] },
                           "metrics.averageOrderValue": {
                              $let: {
                                 vars: {
                                    prevAvg: { $ifNull: ["$metrics.averageOrderValue", 0] },
                                    prevCount: { $ifNull: ["$metrics.totalOrders", 0] }
                                 },
                                 in: {
                                    $cond: [
                                       { $gt: ["$$prevCount", 0] },
                                       { $divide: [ { $add: [ { $multiply: ["$$prevAvg", "$$prevCount"] }, Number(totalReceivedAmount) ] }, { $add: [ "$$prevCount", 1 ] } ] },
                                       Number(totalReceivedAmount)
                                    ]
                                 }
                              }
                           }
                        }
                     }
                  ],
                  { session, new: true }
               );
            } catch (e) {
               console.error('Failed to atomically update supplier metrics:', e);
               // Best-effort fallback: increment and save to avoid losing metric
               try {
                  const supplier = await SuppliserCustomerModel.findById(purchaseOrder.supplierId).session(session);
                  if (supplier) {
                     supplier.totalPurchases = (supplier.totalPurchases || 0) + Number(totalReceivedAmount);
                     supplier.lastPurchaseAmount = Number(totalReceivedAmount);
                     supplier.lastTransactionDate = new Date();
                        supplier.metrics = supplier.metrics || { totalOrders: 0, averageOrderValue: 0, totalPurchaseOrders: 0 };
                        supplier.metrics.totalOrders = (supplier.metrics.totalOrders || 0) + 1;
                        supplier.metrics.totalPurchaseOrders = (supplier.metrics.totalPurchaseOrders || 0) + 1;
                        supplier.metrics.averageOrderValue = ((supplier.totalPurchases + supplier.totalSales) / supplier.metrics.totalOrders) || supplier.metrics.averageOrderValue;
                     await supplier.save({ session });
                  }
               } catch (ee) {
                  console.error('Fallback supplier metrics save failed:', ee);
               }
            }
         }
         

         // Update purchase order items
         purchaseOrder.items = updatedItems;

         // Check if all items are fully received
         const allItemsReceived = purchaseOrder.items.every(item => 
            item.receivedQuantity >= item.quantity
         );

         purchaseOrder.status = allItemsReceived ? 'Completed' : 'PartiallyReceived';
         await purchaseOrder.save({ session });

         // Notify creator and admins about receive/completion
         (async () => {
            try {
               const creatorId = purchaseOrder.createdBy;
               if (creatorId) {
                  let creator = null;
                  try { creator = await UserModal.findById(creatorId).select('name activerole').lean(); } catch(e) { console.warn('Failed to load creator for PO receive notification', e); }
                  const actorName = req.profile?.name || 'A user';
                  const creatorName = creator?.name || 'a user';
                  const orderNo = purchaseOrder.orderNumber || String(purchaseOrder._id);

                  const titleCreator = allItemsReceived ? `Purchase order completed: ${orderNo}` : `Purchase order partially received: ${orderNo}`;
                  const messageCreator = allItemsReceived ? `${actorName} completed receiving items for your purchase order (${orderNo}).` : `${actorName} received items for your purchase order (${orderNo}).`;
                  const payloadCreator = {
                     orgNo: purchaseOrder.orgNo,
                     title: titleCreator,
                     message: messageCreator,
                     type: allItemsReceived ? 'purchase:received:completed' : 'purchase:received:partial',
                     action: { url: `/purchase-orders/${purchaseOrder._id}` },
                     relatedEntity: { entityType: 'PURCHASE_ORDER', entityId: purchaseOrder._id },
                     metadata: { actor: { id: req.profile._id || req.profile.id, name: actorName, role: req.profile?.activerole }, target: { id: creatorId, name: creatorName } }
                  };
                  // If the actor is staff, notify managers+admins (do not notify the actor)
                  const actorRole = req.profile?.activerole || 'staff';
                  if (actorRole === 'staff') {
                     // notify managers and admins about staff receive
                     const payloadManagers = {
                        ...payloadCreator,
                        type: allItemsReceived ? 'purchase:received:completed:notify' : 'purchase:received:partial:notify',
                        message: allItemsReceived ? 
                           `${actorName} completed receiving items for ${creatorName}'s purchase order (${orderNo}).` 
                           : 
                           `${actorName} received items for ${creatorName}'s purchase order (${orderNo}).`
                     };
                     await sendNotification({ orgNo: purchaseOrder.orgNo, roles: ['manager', 'admin'], excludeIds: [req.profile._id || req.profile.id], includeAdmins: false, payload: payloadManagers });
                  } else {
                     // Actor is manager/admin — notify creator and admins (existing behavior)
                     await sendNotification({ orgNo: purchaseOrder.orgNo, userIds: [creatorId], includeAdmins: false, payload: payloadCreator });
                     const payloadAdmin = { ...payloadCreator, type: allItemsReceived ? 'purchase:received:completed:admin' : 'purchase:received:partial:admin', message: allItemsReceived ? `${actorName} completed receiving items for ${creatorName}'s purchase order (${orderNo}).` : `${actorName} received items for ${creatorName}'s purchase order (${orderNo}).` };
                     await sendNotification({ orgNo: purchaseOrder.orgNo, roles: ['admin'], includeAdmins: false, payload: payloadAdmin });
                  }
               }
            } catch (e) { console.error('Notify on receive purchase order failed', e); }
         })();

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
         creatorId,
         warehouseId,
         startDate,
         endDate,
         search,
         sortBy = 'updatedAt',
         sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filter = {
         orgNo: req.profile.orgNo
      };

      if(req.profile.activerole == 'staff'){
         filter.createdBy = req.profile._id;
      }

      console.log({creatorId})

      if(req.profile.activerole !== 'staff'){
         if(creatorId){
            filter.createdBy = creatorId
         }
      }

      if (status) filter.status = status;
      if(status == 'all') delete filter.status;
      
      if (supplierId) filter.supplierId = supplierId;
      if (warehouseId) filter.warehouseId = warehouseId;

      if (startDate || endDate) {
         filter.createdAt = {};
         if (startDate) filter.createdAt.$gte = new Date(new Date(startDate).setHours(0,0,0,0));
         if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23,59,59,999));
      }

      if (search) {
         filter.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } }
         ];
      }

      // Role-based filtering for draft data
      if (req.profile.activerole === 'staff') {
         filter.createdBy = req.profile._id;
      } else {
         filter.$or = [
         { createdBy: req.profile._id }, // All their own data
         { status: { $ne: 'Draft' } } // Others' non-draft data
         ];
      }

      // Execute queries in parallel
      const [orders, totalCount] = await Promise.all([
         PurchaseOrderModal.find(filter)
            .populate('supplierId', 'name email phone')
            .populate('warehouseId', 'name location')
            .populate('createdBy', 'name email phone')
            .populate('approvedBy', 'name email phone')
            .skip(skip)
            .limit(limitNum)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
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
   getPurchaseOrderById,
};
