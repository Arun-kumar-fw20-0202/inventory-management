'use client'
import React, { useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Edit,
  Check,
  X,
  Package
} from 'lucide-react'
import { 
  useFetchPurchaseOrders,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder
} from '@/libs/mutation/purchase-order/purchase-order-mutation'
import PurchaseOrderStatusBadge from './PurchaseOrderStatusBadge'
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal'
import { formatCurrency, formatDate } from '@/libs/utils'

const PurchaseOrdersTable = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
   //  status: '',
    search: '',
   //  startDate: '',
   //  endDate: ''
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Queries
  const { 
    data: purchaseOrdersResponse, 
    isLoading, 
    error,
    refetch 
  } = useFetchPurchaseOrders(filters)

  // Mutations
  const submitPurchaseOrder = useSubmitPurchaseOrder()
  const approvePurchaseOrder = useApprovePurchaseOrder()
  const rejectPurchaseOrder = useRejectPurchaseOrder()

  const orders = purchaseOrdersResponse?.data?.orders || []
  const pagination = purchaseOrdersResponse?.data?.pagination || {}

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  const handleSubmitOrder = async (orderId) => {
    try {
      await submitPurchaseOrder.mutateAsync(orderId)
    } catch (error) {
      console.error('Failed to submit order:', error)
    }
  }

  const handleApproveOrder = async (orderId) => {
    try {
      await approvePurchaseOrder.mutateAsync(orderId)
    } catch (error) {
      console.error('Failed to approve order:', error)
    }
  }

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      try {
        await rejectPurchaseOrder.mutateAsync({ id: orderId, reason })
      } catch (error) {
        console.error('Failed to reject order:', error)
      }
    }
  }

  const getActionButtons = (order) => {
    const buttons = []

    // View Details button (always available)
    buttons.push(
      <Button
        key="view"
        size="sm"
        variant="light"
        isIconOnly
        onPress={() => handleViewDetails(order)}
      >
        <Eye className="w-4 h-4" />
      </Button>
    )

    // Status-specific action buttons
    if (order.status === 'Draft') {
      buttons.push(
        <Button
          key="submit"
          size="sm"
          color="primary"
          variant="flat"
          onPress={() => handleSubmitOrder(order._id)}
          isLoading={submitPurchaseOrder.isPending}
        >
          Submit
        </Button>
      )
    }

    if (order.status === 'PendingApproval') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          color="success"
          variant="flat"
          startContent={<Check className="w-3 h-3" />}
          onPress={() => handleApproveOrder(order._id)}
          isLoading={approvePurchaseOrder.isPending}
        >
          Approve
        </Button>,
        <Button
          key="reject"
          size="sm"
          color="danger"
          variant="flat"
          startContent={<X className="w-3 h-3" />}
          onPress={() => handleRejectOrder(order._id)}
          isLoading={rejectPurchaseOrder.isPending}
        >
          Reject
        </Button>
      )
    }

    return buttons
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-red-500">Error loading purchase orders: {error.message}</p>
            <Button 
              color="primary" 
              variant="flat" 
              onPress={refetch}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
            <div className="flex gap-2">
              <Button
                variant="light"
                startContent={<RefreshCw className="w-4 h-4" />}
                onPress={refetch}
                isLoading={isLoading}
              >
                Refresh
              </Button>
              <Button
                variant="light"
                startContent={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="gap-4 w-full grid grid-cols-1 md:grid-cols-4">
            <Input
              variant='bordered'
              placeholder="Search orders..."
              startContent={<Search className="w-4 h-4" />}
              value={filters.search}
              onValueChange={(value) => handleFilterChange('search', value)}
              className="max-w-xs"
            />
            
            <Select
              variant='bordered'
              placeholder="Filter by status"
              value={filters.status}
              onSelectionChange={(value) => handleFilterChange('status', value)}
              className="max-w-xs"
            >
              <SelectItem key="" value="">All Statuses</SelectItem>
              <SelectItem key="Draft" value="Draft">Draft</SelectItem>
              <SelectItem key="PendingApproval" value="PendingApproval">Pending Approval</SelectItem>
              <SelectItem key="Approved" value="Approved">Approved</SelectItem>
              <SelectItem key="PartiallyReceived" value="PartiallyReceived">Partially Received</SelectItem>
              <SelectItem key="Completed" value="Completed">Completed</SelectItem>
              <SelectItem key="Cancelled" value="Cancelled">Cancelled</SelectItem>
            </Select>

            <Input
              variant='bordered'
              type="date"
              placeholder="Start date"
              value={filters.startDate}
              onValueChange={(value) => handleFilterChange('startDate', value)}
              className="max-w-xs"
            />

            <Input
              variant='bordered'
              type="date"
              placeholder="End date"
              value={filters.endDate}
              onValueChange={(value) => handleFilterChange('endDate', value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No purchase orders found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium">Order Number</th>
                      <th className="text-left py-3 px-4 font-medium">Supplier</th>
                      <th className="text-left py-3 px-4 font-medium">Warehouse</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Total Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Expected Delivery</th>
                      <th className="text-left py-3 px-4 font-medium">Created</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-primary">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          {order.supplierId?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {order.warehouseId?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <PurchaseOrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          {order.expectedDeliveryDate 
                            ? formatDate(order.expectedDeliveryDate)
                            : 'Not set'
                          }
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 justify-end">
                            {getActionButtons(order)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {orders.map((order) => (
                  <Card key={order._id} className="shadow-sm">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-primary">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.supplierId?.name}</p>
                        </div>
                        <PurchaseOrderStatusBadge status={order.status} />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warehouse:</span>
                          <span>{order.warehouseId?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected:</span>
                          <span>
                            {order.expectedDeliveryDate 
                              ? formatDate(order.expectedDeliveryDate)
                              : 'Not set'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 flex-wrap">
                        {getActionButtons(order)}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {' '}
                    {pagination.totalItems} results
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="flat"
                      size="sm"
                      onPress={() => handlePageChange(pagination.currentPage - 1)}
                      isDisabled={!pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={pagination.currentPage === page ? "solid" : "flat"}
                            size="sm"
                            onPress={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="flat"
                      size="sm"
                      onPress={() => handlePageChange(pagination.currentPage + 1)}
                      isDisabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Details Modal */}
      <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        orderId={selectedOrder?._id}
      />
    </>
  )
}

export default PurchaseOrdersTable