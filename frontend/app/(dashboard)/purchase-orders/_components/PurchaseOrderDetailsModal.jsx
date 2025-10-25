'use client'
import React, { useState } from 'react'

import { Button } from '@heroui/button'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { 
  Package, 
  Truck, 
  FileText,
  Check,
  X,
} from 'lucide-react'
import { 
  useFetchPurchaseOrderById,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
} from '@/libs/mutation/purchase-order/purchase-order-mutation'
import PurchaseOrderStatusBadge from './PurchaseOrderStatusBadge'
import ReceiveItemsModal from './ReceiveItemsModal'
import { formatCurrency, formatDate, formatDateRelative } from '@/libs/utils'
import { useSelector } from 'react-redux'
import { useHasPermission } from '@/libs/utils/check-permission'
import { PERMISSION_MODULES } from '@/libs/utils'
import ConfirmActionModal from '@/app/(dashboard)/sales/all/_components/ConfirmActionModal'

const PurchaseOrderDetailsModal = ({ orderId }) => {
  const user = useSelector((state) => state.auth.user?.data);
  const whocanapprovereject = ['admin', 'manager']
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  
  // Queries
  const { 
    data: orderResponse, 
    isLoading, 
    error,
    refetch
  } = useFetchPurchaseOrderById(orderId)

  // Mutations
  const submitPurchaseOrder = useSubmitPurchaseOrder()
  const approvePurchaseOrder = useApprovePurchaseOrder()
  const rejectPurchaseOrder = useRejectPurchaseOrder()

  const order = orderResponse?.data

  // permission checks (hooks must be called at top-level)
  const canApprovePerm = useHasPermission(PERMISSION_MODULES.PURCHASES, 'approve')
  const canRejectPerm = useHasPermission(PERMISSION_MODULES.PURCHASES, 'reject')
  const canReceivePerm = useHasPermission(PERMISSION_MODULES.PURCHASES, 'receive')


  const handleSubmitOrder = async () => {
    // open confirmation modal
    setConfirmTitle('Submit Purchase Order')
    setConfirmMessage('Submit this purchase order for approval?')
    setConfirmShowReason(false)
    setConfirmPayload({ action: 'submit' })
    setConfirmOpen(true)
  }

  const handleApproveOrder = async () => {
    // open confirmation modal
    setConfirmTitle('Approve Purchase Order')
    setConfirmMessage('Approve this purchase order?')
    setConfirmShowReason(false)
    setConfirmPayload({ action: 'approve' })
    setConfirmOpen(true)
  }

  const handleRejectOrder = async () => {
    // open confirmation modal with reason textarea
    setConfirmTitle('Reject Purchase Order')
    setConfirmMessage('Please provide a reason for rejection (optional)')
    setConfirmShowReason(true)
    setConfirmPayload({ action: 'reject' })
    setConfirmOpen(true)
  }

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmShowReason, setConfirmShowReason] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState(null)

  const handleConfirm = async (reason) => {
    if (!confirmPayload || !confirmPayload.action) {
      setConfirmOpen(false)
      return
    }

    try {
      if (confirmPayload.action === 'submit') {
        await submitPurchaseOrder.mutateAsync(orderId)
      } else if (confirmPayload.action === 'approve') {
        await approvePurchaseOrder.mutateAsync(orderId)
      } else if (confirmPayload.action === 'reject') {
        await rejectPurchaseOrder.mutateAsync({ id: orderId, reason: reason || '' })
      }
      // refresh data
      refetch && refetch()
    } catch (err) {
      console.error('Action failed', err)
    } finally {
      setConfirmOpen(false)
      setConfirmPayload(null)
    }
  }

  const handleReceiveItems = () => {
    setIsReceiveModalOpen(true)
  }

  const getActionButtons = () => {
    if (!order) return null

    const buttons = []

    if (order?.status === 'Draft') {
      buttons.push(
        <Button
          key="submit"
          color="primary"
          onPress={handleSubmitOrder}
          isLoading={submitPurchaseOrder.isPending}
        >
          Submit for Approval
        </Button>
      )
    }

    if (order?.status === 'PendingApproval' && whocanapprovereject.includes(user?.activerole)) {
      if (canApprovePerm) {
        buttons.push(
          <Button size='sm' key="approve" color="success" startContent={<Check className="w-4 h-4" />} onPress={handleApproveOrder} isLoading={approvePurchaseOrder.isPending} >Approve</Button>
        )
      }
      if (canRejectPerm) {
        buttons.push(
          <Button size='sm' key="reject" color="danger" variant="flat" startContent={<X className="w-4 h-4" />} onPress={handleRejectOrder} isLoading={rejectPurchaseOrder.isPending}>Reject</Button>
        )
      }
    }

    if ((order?.status === 'Approved' || order?.status === 'PartiallyReceived') && canReceivePerm) {
      buttons.push(
        <Button
          key="receive"
          color="secondary"
          startContent={<Package className="w-4 h-4" />}
          onPress={handleReceiveItems}
        >
          Receive Items
        </Button>
      )
    }

    return buttons
  }

  const calculateReceivedPercentage = (item) => {
    return Math.round((item.receivedQuantity / item.quantity) * 100)
  }

  return (
    <>
      <div className='p-4 flex flex-col gpa-4'>
        {/* Header with action buttons on the top-right */}
        <Card className="flex flex-row items-center justify-between p-3 gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-12 h-12 text-primary" />
            <div>
              <h2 className="text-xl font-bold">
                {order?.orderNumber || 'Purchase Order Details'}
              </h2>
              {order && (
                <div className="flex items-center gap-2 mt-1">
                  <PurchaseOrderStatusBadge status={order?.status} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Created {formatDateRelative(order?.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons moved to top-right for immediate access */}
          <div className="flex items-center gap-2">
            {getActionButtons()}
          </div>
        </Card>

        {/* <DrawerBody> */}
        <div>
          {isLoading ? (
            // Skeleton placeholders while loading
            <div className="space-y-6 my-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="shadow-sm rounded-md p-4 bg-gray-100 dark:bg-gray-800 animate-pulse">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 mb-3 rounded"></div>
                  <div className="h-3 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="shadow-sm rounded-md p-4 bg-gray-100 dark:bg-gray-800 animate-pulse">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 mb-3 rounded"></div>
                  <div className="h-3 w-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>

              <div className="shadow-sm rounded-md p-4 bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 mb-2 rounded"></div>
                    <div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 mb-2 rounded"></div>
                    <div className="h-5 w-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 mb-2 rounded"></div>
                    <div className="h-5 w-36 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>

              <div className="shadow-sm rounded-md p-4 bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr>
                        <th className="py-2"><div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                        <th className="py-2"><div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                        <th className="py-2"><div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                        <th className="py-2"><div className="h-3 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                        <th className="py-2"><div className="h-3 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                        <th className="py-2"><div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4].map(i => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div></td>
                          <td className="py-3 text-center"><div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div></td>
                          <td className="py-3 text-center"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div></td>
                          <td className="py-3 text-center"><div className="h-4 w-10 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div></td>
                          <td className="py-3 text-center"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div></td>
                          <td className="py-3 text-right"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded ml-auto"></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading order details: {error.message}</p>
            </div>
          ) : order ? (
            <div className="space-y-6 my-5">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Supplier Information</h3>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      <p className="font-medium">{order?.supplierId?.name || 'N/A'}</p>
                      {order?.supplierId?.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order?.supplierId?.email}</p>
                      )}
                      {order?.supplierId?.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order?.supplierId?.phone}</p>
                      )}
                    </div>
                  </CardBody>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Warehouse Information</h3>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      <p className="font-medium">{order?.warehouseId?.name || 'N/A'}</p>
                      {order?.warehouseId?.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order?.warehouseId?.location}</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Order Details */}
              <Card className="shadow-sm">
                <CardHeader>
                  <h3 className="font-semibold">Order Details</h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">Total Amount</label>
                      <p className="font-semibold text-success text-lg">{formatCurrency(order?.totalAmount, 'INR')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">Expected Delivery</label>
                      <p className="font-medium">
                        {order?.expectedDeliveryDate 
                          ? formatDate(order?.expectedDeliveryDate)
                          : 'Not specified'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">Created By</label>
                      <p className="font-medium">{order?.createdBy?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {order?.approvedBy && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">Approved By</label>
                        <p className="font-medium">{order?.approvedBy.name}</p>
                      </div>
                    </div>
                  )}

                  {order?.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Notes</label>
                      <p className="mt-1">{order?.notes}</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Order Items */}
              <Card className="shadow-sm">
                <CardHeader>
                  <h3 className="font-semibold">Order Items</h3>
                </CardHeader>
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="w-full overflow-x-auto table-auto border-collapse">
                      <thead>
                        <tr className="text-sm border-b border-gray-200 dark:border-gray-800 text-nowrap gap-3">
                          <th className="text-left py-2 font-medium">Product</th>
                          <th className="text-center py-2 font-medium">Quantity</th>
                          <th className="text-center py-2 font-medium">Unit Price</th>
                          <th className="text-center py-2 font-medium">Received</th>
                          <th className="text-center py-2 font-medium">Progress</th>
                          <th className="text-right py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order?.items?.map((item, index) => {
                          const receivedPercentage = calculateReceivedPercentage(item)
                          return (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800 text-sm">
                              <td className="py-3">
                                <div>
                                  <p className="font-medium">{item.productId?.productName || 'N/A'}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    SKU: {item.productId?.sku || 'N/A'}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 text-center font-medium">
                                {item.quantity}
                              </td>
                              <td className="py-3 text-center text-warning">
                                {formatCurrency(item.unitPrice, 'INR')}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`font-medium ${
                                  item.receivedQuantity === item.quantity 
                                    ? 'text-green-600' 
                                    : item.receivedQuantity > 0 
                                      ? 'text-orange-600' 
                                      : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {item.receivedQuantity}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        receivedPercentage === 100 
                                          ? 'bg-green-500' 
                                          : receivedPercentage > 0 
                                            ? 'bg-orange-500' 
                                            : 'bg-gray-400'
                                      }`}
                                      style={{ width: `${receivedPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {receivedPercentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-right font-medium text-warning">
                                {formatCurrency(item.total, 'INR')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 dark:border-gray-800">
                          <td colSpan="5" className="py-3 text-right font-semibold">
                            Total Amount:
                          </td>
                          <td className="py-3 text-right font-bold text-lg text-success">
                            {formatCurrency(order?.totalAmount, 'INR')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Order not found</p>
            </div>
          )}
        </div>
        {/* </DrawerBody> */}

        {/* <div className="flex gap-2 w-full justify-between">
          <div className="flex gap-2">
            {getActionButtons()}
          </div>
        </div> */}
      </div>

      {/* Receive Items Modal */}
      {/* Confirmation modal for submit/approve/reject actions */}
      <ConfirmActionModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        showReason={confirmShowReason}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />

      {/* Receive Items Modal */}
      <ReceiveItemsModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        order={order}
      />
    </>
  )
}

export default PurchaseOrderDetailsModal