/**
 * Purchase Order Hooks Usage Examples
 * This file demonstrates how to use the purchase order mutations and queries
 * in your React components.
 */

import React, { useState } from 'react';
import {
  // Mutations
  useCreatePurchaseOrder,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
  useReceivePurchaseOrder,
  
  // Queries
  useFetchPurchaseOrders,
  useFetchPurchaseOrderById,
  useFetchPendingApprovals,
  useFetchPurchaseOrdersSummary,
  useSearchPurchaseOrders,
} from '@/libs/mutation/purchase-order/purchase-order-mutation';

// ================================
// CREATE PURCHASE ORDER EXAMPLE
// ================================

export const CreatePurchaseOrderForm = () => {
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    expectedDeliveryDate: '',
    notes: ''
  });

  const createPurchaseOrder = useCreatePurchaseOrder();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createPurchaseOrder.mutateAsync(formData);
      // Form will reset automatically and show success toast
      setFormData({
        supplierId: '',
        warehouseId: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
        expectedDeliveryDate: '',
        notes: ''
      });
    } catch (error) {
      // Error is handled automatically with toast
      console.error('Failed to create purchase order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs here */}
      <button 
        type="submit" 
        disabled={createPurchaseOrder.isPending}
      >
        {createPurchaseOrder.isPending ? 'Creating...' : 'Create Purchase Order'}
      </button>
    </form>
  );
};

// ================================
// PURCHASE ORDERS LIST EXAMPLE
// ================================

export const PurchaseOrdersList = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: ''
  });

  const { 
    data: purchaseOrdersResponse, 
    isLoading, 
    error,
    refetch 
  } = useFetchPurchaseOrders(filters);

  const submitPurchaseOrder = useSubmitPurchaseOrder();
  const approvePurchaseOrder = useApprovePurchaseOrder();
  const rejectPurchaseOrder = useRejectPurchaseOrder();

  const handleSubmitOrder = async (orderId) => {
    try {
      await submitPurchaseOrder.mutateAsync(orderId);
    } catch (error) {
      console.error('Failed to submit order:', error);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      await approvePurchaseOrder.mutateAsync(orderId);
    } catch (error) {
      console.error('Failed to approve order:', error);
    }
  };

  const handleRejectOrder = async (orderId, reason) => {
    try {
      await rejectPurchaseOrder.mutateAsync({ id: orderId, reason });
    } catch (error) {
      console.error('Failed to reject order:', error);
    }
  };

  if (isLoading) return <div>Loading purchase orders...</div>;
  if (error) return <div>Error loading purchase orders: {error.message}</div>;

  const { orders, pagination } = purchaseOrdersResponse?.data || {};

  return (
    <div>
      {/* Filters */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="PendingApproval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="PartiallyReceived">Partially Received</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <table>
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>Total Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((order) => (
            <tr key={order._id}>
              <td>{order.orderNumber}</td>
              <td>{order.supplierId?.name || 'N/A'}</td>
              <td>
                <span className={`badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td>${order.totalAmount.toFixed(2)}</td>
              <td>
                {order.status === 'Draft' && (
                  <button
                    onClick={() => handleSubmitOrder(order._id)}
                    disabled={submitPurchaseOrder.isPending}
                  >
                    Submit
                  </button>
                )}
                {order.status === 'PendingApproval' && (
                  <>
                    <button
                      onClick={() => handleApproveOrder(order._id)}
                      disabled={approvePurchaseOrder.isPending}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectOrder(order._id, 'Rejected by admin')}
                      disabled={rejectPurchaseOrder.isPending}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
            ({pagination.totalItems} total items)
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={!pagination.hasNextPage}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ================================
// PURCHASE ORDER DETAILS EXAMPLE
// ================================

export const PurchaseOrderDetails = ({ orderId }) => {
  const { 
    data: orderResponse, 
    isLoading, 
    error 
  } = useFetchPurchaseOrderById(orderId);

  const receivePurchaseOrder = useReceivePurchaseOrder();
  const [receivingItems, setReceivingItems] = useState({});

  const handleReceiveItems = async () => {
    const receivedItems = Object.entries(receivingItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, receivedQuantity]) => ({
        productId,
        receivedQuantity: parseInt(receivedQuantity)
      }));

    if (receivedItems.length === 0) {
      alert('Please specify quantities to receive');
      return;
    }

    try {
      await receivePurchaseOrder.mutateAsync({
        id: orderId,
        receivedItems
      });
      setReceivingItems({});
    } catch (error) {
      console.error('Failed to receive items:', error);
    }
  };

  if (isLoading) return <div>Loading order details...</div>;
  if (error) return <div>Error loading order: {error.message}</div>;

  const order = orderResponse?.data;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h2>Purchase Order: {order.orderNumber}</h2>
      
      {/* Order Info */}
      <div className="order-info">
        <p><strong>Supplier:</strong> {order.supplierId?.name}</p>
        <p><strong>Warehouse:</strong> {order.warehouseId?.name}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
        <p><strong>Expected Delivery:</strong> {order.expectedDeliveryDate}</p>
        {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
      </div>

      {/* Items */}
      <div className="order-items">
        <h3>Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Received</th>
              <th>Total</th>
              {(order.status === 'Approved' || order.status === 'PartiallyReceived') && (
                <th>Receive Qty</th>
              )}
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index}>
                <td>{item.productId?.name} ({item.productId?.sku})</td>
                <td>{item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>{item.receivedQuantity}</td>
                <td>${item.total.toFixed(2)}</td>
                {(order.status === 'Approved' || order.status === 'PartiallyReceived') && (
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity - item.receivedQuantity}
                      value={receivingItems[item.productId._id] || ''}
                      onChange={(e) => setReceivingItems({
                        ...receivingItems,
                        [item.productId._id]: e.target.value
                      })}
                      placeholder="Qty to receive"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {(order.status === 'Approved' || order.status === 'PartiallyReceived') && (
          <button
            onClick={handleReceiveItems}
            disabled={receivePurchaseOrder.isPending}
            className="mt-4"
          >
            {receivePurchaseOrder.isPending ? 'Receiving...' : 'Receive Items'}
          </button>
        )}
      </div>
    </div>
  );
};

// ================================
// DASHBOARD SUMMARY EXAMPLE
// ================================

export const PurchaseOrderDashboard = () => {
  const { data: summaryResponse, isLoading: summaryLoading } = useFetchPurchaseOrdersSummary();
  const { data: pendingResponse, isLoading: pendingLoading } = useFetchPendingApprovals({ limit: 5 });

  if (summaryLoading || pendingLoading) return <div>Loading dashboard...</div>;

  const summary = summaryResponse?.data;
  const pendingOrders = pendingResponse?.data?.orders;

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Draft Orders</h3>
          <p className="count">{summary?.draft || 0}</p>
        </div>
        <div className="card">
          <h3>Pending Approval</h3>
          <p className="count">{summary?.pending || 0}</p>
        </div>
        <div className="card">
          <h3>Approved Orders</h3>
          <p className="count">{summary?.approved || 0}</p>
        </div>
        <div className="card">
          <h3>Completed Orders</h3>
          <p className="count">{summary?.completed || 0}</p>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingOrders && pendingOrders.length > 0 && (
        <div className="pending-approvals">
          <h3>Orders Pending Approval</h3>
          <ul>
            {pendingOrders.map(order => (
              <li key={order._id}>
                <span>{order.orderNumber}</span>
                <span>${order.totalAmount.toFixed(2)}</span>
                <span>{order.supplierId?.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ================================
// SEARCH EXAMPLE
// ================================

export const PurchaseOrderSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { 
    data: searchResults, 
    isLoading, 
    error 
  } = useSearchPurchaseOrders(debouncedSearch);

  return (
    <div>
      <input
        type="text"
        placeholder="Search purchase orders..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {isLoading && <div>Searching...</div>}
      {error && <div>Search error: {error.message}</div>}
      
      {searchResults?.data?.orders && (
        <div className="search-results">
          <h3>Search Results ({searchResults.data.pagination.totalItems})</h3>
          {searchResults.data.orders.map(order => (
            <div key={order._id} className="search-result-item">
              <h4>{order.orderNumber}</h4>
              <p>Supplier: {order.supplierId?.name}</p>
              <p>Status: {order.status}</p>
              <p>Amount: ${order.totalAmount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================================
// UTILITY FUNCTIONS
// ================================

const getStatusClass = (status) => {
  const statusClasses = {
    Draft: 'bg-gray-100 text-gray-800',
    PendingApproval: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    PartiallyReceived: 'bg-orange-100 text-orange-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
};

// ================================
// CUSTOM HOOKS EXAMPLES
// ================================

// Custom hook for managing purchase order workflow
export const usePurchaseOrderWorkflow = (orderId) => {
  const submitMutation = useSubmitPurchaseOrder();
  const approveMutation = useApprovePurchaseOrder();
  const rejectMutation = useRejectPurchaseOrder();
  const receiveMutation = useReceivePurchaseOrder();

  const handleAction = async (action, data = {}) => {
    switch (action) {
      case 'submit':
        return await submitMutation.mutateAsync(orderId);
      case 'approve':
        return await approveMutation.mutateAsync(orderId);
      case 'reject':
        return await rejectMutation.mutateAsync({ id: orderId, ...data });
      case 'receive':
        return await receiveMutation.mutateAsync({ id: orderId, ...data });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };

  return {
    handleAction,
    isLoading: submitMutation.isPending || approveMutation.isPending || 
               rejectMutation.isPending || receiveMutation.isPending,
  };
};

// Custom hook for purchase order stats
export const usePurchaseOrderStats = () => {
  const { data: summaryResponse } = useFetchPurchaseOrdersSummary();
  
  const totalOrders = React.useMemo(() => {
    if (!summaryResponse?.data) return 0;
    const { draft, pending, approved, completed } = summaryResponse.data;
    return draft + pending + approved + completed;
  }, [summaryResponse]);

  return {
    summary: summaryResponse?.data,
    totalOrders,
  };
};