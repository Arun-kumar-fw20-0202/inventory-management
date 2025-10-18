'use client'
import React, { useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { 
  Search, 
  Download, 
  RefreshCw,
  Eye,
  Check,
  X,
  Package,
} from 'lucide-react'
import { 
  useFetchPurchaseOrders,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder
} from '@/libs/mutation/purchase-order/purchase-order-mutation'
import ConfirmActionModal from '@/app/(dashboard)/sales/all/_components/ConfirmActionModal'
// import PurchaseOrderDetailsModal from './PurchaseOrderDetailsModal'
import PurchaseOrdersCardView from './PurchaseOrdersCardView'
import PurchaseOrdersTableView from './PurchaseOrdersTableView'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import UsersAutocomplete from '@/components/dynamic/user-autocomplete'

const PurchaseOrdersTable = () => {
  const activerole = useSelector((state) => state.auth.user?.data?.activerole);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 30,
    status: undefined,
    search: '',
    startDate: undefined,
    endDate: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' // 'asc' | 'desc'
  })

  // const [selectedOrder, setSelectedOrder] = useState(null)
  // const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Queries
  const { 
    data: purchaseOrdersResponse, 
    isLoading, 
    error,
    refetch 
  } = useFetchPurchaseOrders(filters)

  // router
  const router = useRouter();

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
    router.push(`/purchase-orders/${order._id}`);
  }

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmShowReason, setConfirmShowReason] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState(null)

  const openConfirm = ({ title, message, showReason = false, payload = null }) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    setConfirmShowReason(showReason)
    setConfirmPayload(payload)
    setConfirmOpen(true)
  }

  const handleConfirm = async (reason) => {
    if (!confirmPayload || !confirmPayload.action) {
      setConfirmOpen(false)
      return
    }

    try {
      const { action, id } = confirmPayload
      if (action === 'submit') {
        await submitPurchaseOrder.mutateAsync(id)
      } else if (action === 'approve') {
        await approvePurchaseOrder.mutateAsync(id)
      } else if (action === 'reject') {
        await rejectPurchaseOrder.mutateAsync({ id, reason: reason || '' })
      }
      refetch && refetch()
    } catch (err) {
      console.error('Action failed', err)
    } finally {
      setConfirmOpen(false)
      setConfirmPayload(null)
    }
  }

  const getActionButtons = (order) => {
    const actions = []

    // View action
    actions.push({
      key: 'view',
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => handleViewDetails(order),
    })

    // Submit (open confirm)
    if (order.status === 'Draft' && (activerole === 'manager' || activerole === 'admin')) {
      actions.push({
        key: 'submit',
        label: 'Submit',
        icon: null,
        onClick: () => openConfirm({ title: 'Submit Purchase Order', message: 'Submit this purchase order for approval?', showReason: false, payload: { action: 'submit', id: order._id } }),
        isLoading: submitPurchaseOrder.isPending,
      })
    }

    // Approve / Reject
    if (order.status === 'PendingApproval' && activerole === 'admin') {
      actions.push({
        key: 'approve',
        label: 'Approve',
        icon: <Check className="w-3 h-3" />,
        onClick: () => openConfirm({ title: 'Approve Purchase Order', message: 'Approve this purchase order?', showReason: false, payload: { action: 'approve', id: order._id } }),
        isLoading: approvePurchaseOrder.isPending,
      })

      actions.push({
        key: 'reject',
        label: 'Reject',
        icon: <X className="w-3 h-3" />,
        onClick: () => openConfirm({ title: 'Reject Purchase Order', message: 'Please provide a reason for rejection (optional)', showReason: true, payload: { action: 'reject', id: order._id } }),
        isLoading: rejectPurchaseOrder.isPending,
        color: 'danger'
      })
    }

    return actions
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
            <div className="">
              <h2 className="text-xl font-semibold">Purchase Orders</h2>
              <span className='text-gray-500 dark:text-gray-300'>
                {purchaseOrdersResponse?.data?.pagination?.totalItems || 0} total orders
              </span>
            </div>
            <div className="flex gap-2">
              {/* <Button size='sm' isIconOnly color='primary' variant={viewMode === 'table' ? 'solid' : 'flat'} onPress={() => setViewMode('table')} startContent={<TableOfContents size={18} />} />
              <Button size='sm' isIconOnly color='primary' variant={viewMode === 'card' ? 'solid' : 'flat'} onPress={() => setViewMode('card')} startContent={<GridIcon size={18} />}/> */}
              <Button variant="light" startContent={<RefreshCw className="w-4 h-4" />} onPress={refetch} isLoading={isLoading}>
                Refresh
              </Button>
              <Button variant="light" startContent={<Download className="w-4 h-4" />}>Export</Button>
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
              placeholder="Sort Order"
              value={filters.sortOrder}
              defaultSelectedKeys={new Set([filters.sortOrder])}
              onChange={(value) => handleFilterChange('sortOrder', value?.target?.value)}
              className="max-w-xs"
            >
              <SelectItem key='asc' value='asc'>Sort Ascending</SelectItem>
              <SelectItem key='desc' value='desc'>Sort Descending</SelectItem>
            </Select>

            <Select
              variant='bordered'
              placeholder="Sort By"
              value={filters.sortBy}
              defaultSelectedKeys={new Set([filters.sortBy])}
              onChange={(value) => handleFilterChange('sortBy', value?.target?.value)}
              className="max-w-xs"
            >
              <SelectItem key='createdAt' value='createdAt'>Sort by Created At</SelectItem>
              <SelectItem key='updatedAt' value='updatedAt'>Sort by Updated At</SelectItem>
              <SelectItem key='expectedDeliveryDate' value='expectedDeliveryDate'>Sort by Expected Delivery</SelectItem>
              <SelectItem key='totalAmount' value='totalAmount'>Sort by Total Amount</SelectItem>
            </Select>
            
            <Select
              variant='bordered'
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value?.target?.value)}
              className="max-w-xs"
            >
              {/* all */}
              <SelectItem key="all" value="all">All</SelectItem>
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

            {activerole !== 'staff' && (
              <UsersAutocomplete 
                variant='bordered'
                // size='sm'
                placeholder="Search user"
                // label='User'
                onSelectChange={(id) => handleFilterChange('creatorId', id)}
              />
            )}
            
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

      {/* Confirmation modal for actions */}
      <ConfirmActionModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        showReason={confirmShowReason}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      {/* Details Modal */}
      {/* <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        orderId={selectedOrder?._id}
      /> */}
    </>
  )
}

export default PurchaseOrdersTable