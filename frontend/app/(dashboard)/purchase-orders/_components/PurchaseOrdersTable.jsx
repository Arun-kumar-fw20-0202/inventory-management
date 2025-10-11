'use client'
import React, { useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Check,
  X,
  Package,
  TableIcon,
  GridIcon,
  TableOfContents,
} from 'lucide-react'
import { 
  useFetchPurchaseOrders,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder
} from '@/libs/mutation/purchase-order/purchase-order-mutation'
import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal'
import PurchaseOrdersCardView from './PurchaseOrdersCardView'
import PurchaseOrdersTableView from './PurchaseOrdersTableView'
import { useSelector } from 'react-redux'

const PurchaseOrdersTable = () => {
  const activerole = useSelector((state) => state.auth.user?.data?.activerole);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    // status: '',
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
  const [viewMode, setViewMode] = useState('table') // 'table' | 'card'

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
        variant="flat"
        isIconOnly
        onPress={() => handleViewDetails(order)}
      >
        <Eye className="w-4 h-4" />
      </Button>
    )

    // Status-specific action buttons
    if (order.status === 'Draft' && (activerole === 'manager' || activerole === 'admin')) {
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

    if (order.status === 'PendingApproval' && activerole === 'admin') {
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
              <Button size='sm' isIconOnly color='primary' variant={viewMode === 'table' ? 'solid' : 'flat'} onPress={() => setViewMode('table')} startContent={<TableOfContents size={18} />} />
              <Button size='sm' isIconOnly color='primary' variant={viewMode === 'card' ? 'solid' : 'flat'} onPress={() => setViewMode('card')} startContent={<GridIcon size={18} />}/>
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
                {viewMode === 'table' ? (
                  <PurchaseOrdersTableView
                    orders={orders}
                    isLoading={isLoading}
                    pagination={pagination}
                    onViewDetails={handleViewDetails}
                    getActionButtons={getActionButtons}
                    onPageChange={handlePageChange}
                  />
                ) : (
                  <PurchaseOrdersCardView
                    orders={orders}
                    isLoading={isLoading}
                    pagination={pagination}
                    onViewDetails={handleViewDetails}
                    getActionButtons={getActionButtons}
                    onPageChange={handlePageChange}
                  />
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