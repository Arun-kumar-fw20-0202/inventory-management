'use client'
import { useFetchSaleById, useApproveSale, useCompleteSale, useRejectSale, useSubmitSale, useUpdatePaymentStatus } from '@/libs/mutation/sales/sales-mutations'
import React, { useCallback, useMemo } from 'react'
import { Package, User, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card } from '@heroui/card'
import { Button } from '@heroui/button'
import PageAccess from '@/components/role-page-access'
import { useSelector } from 'react-redux'
import { InvoiceFormatter } from '@/components/invoice'
import { Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from '@heroui/modal'
import toast from 'react-hot-toast'
import { Radio, RadioGroup } from '@heroui/radio'
import {Alert} from "@heroui/alert";
import ConfirmActionModal from '@/app/(dashboard)/sales/all/_components/ConfirmActionModal'
import { formatDateRelative, PERMISSION_MODULES } from '@/libs/utils'
import { Chip } from '@heroui/chip'
import CheckPagePermission from '@/components/check-page-permissoin'
import { useHasPermission } from '@/libs/utils/check-permission'

const Index = (saleId) => {
  const id = saleId?.params?.saleId
  const readPermission = useHasPermission(PERMISSION_MODULES.SALES, 'read')
  if (!readPermission) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='max-w-md mx-auto text-center p-8 rounded-2xl shadow-lg'>
          <div className='w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center'>
              <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10' />
              </svg>
          </div>
          <h1 className='text-2xl font-bold mb-3'>Access Denied</h1>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>You don't have permission to view this page. Please contact your administrator if you believe this is an error.</p>
          <button
              onClick={() => window.history.back()}
              className='px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200'
          >
              Go Back
          </button>
        </div>
    </div>
    )
  }
  const { data: saleData, isLoading, error, refetch } = useFetchSaleById(id)
  const {isOpen, onOpen, onOpenChange} = useDisclosure()


  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (!saleData?.data && !id) return <EmptyState />

  const sale = saleData.data

  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.SALES, action: 'read' }}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className=" mx-auto space-y-6">
          <InvoiceModal 
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            sale={sale}
          />
          {/* Header */}
          <Header sale={sale} onOpenChange={onOpenChange} refetch={refetch} />

          {/* {sale?.rejectedReason && (
            <Alert color='danger' description={`Reason : ${sale?.rejectedReason}`} title={<p>The sale was rejected <b>{`( ${formatDateRelative(sale?.rejectedAt)} )`}</b> and Rejected By <b>{user?.data?.id == sale?.rejectedBy?._id ? "( You )" : sale?.rejectedBy?.name}</b></p>} />
          )} */}
          <Card>
            <AllAlertBoxs sale={sale} />
          </Card>

          {/* Status Cards */}
          <StatusCards sale={sale} />

          {/* Customer Info */}
          <CustomerInfo customer={sale.customerId} />

          {/* Items Table */}
          <ItemsTable items={sale.items} />

          {/* Payment Summary */}
          <PaymentSummary sale={sale} />

          {/* Timeline */}
          <Timeline sale={sale} />
        </div>
      </div>
    </CheckPagePermission>
  )
}

const AllAlertBoxs = ({ sale }) => {
  const user = useSelector((state) => state.auth.user)

  if (!sale) return null

  const me = user?.data?.id
  const whoName = (person) => {
    if (!person) return '—'
    if (person._id && person._id === me) return `${person.name} (You)`
    return person.name || '—'
  }

  // Rejected (highest priority)
  if (sale.rejectedReason) {
    const rejectedBy = sale.rejectedBy || {}
    return (
      <Alert
        color="danger"
        title={<div className="font-semibold">Sale Rejected — {formatDateRelative(sale.rejectedAt)}</div>}
        description={
          <div className="space-y-1">
            <p className="text-sm">This sale was rejected by <b>{whoName(rejectedBy)}</b>.</p>
            <p className="text-sm">Reason: <span className="font-medium">{sale.rejectedReason}</span></p>
            <p className="text-sm text-default-400">If this rejection looks incorrect, please contact your organisation admin to review the decision.</p>
          </div>
        }
      />
    )
  }

  // Completed
  if (sale.status === 'completed') {
    const completedBy = sale.completedBy || {}
    return (
      <Alert
        color="success"
        title={<div className="font-semibold">Sale Completed — {formatDateRelative(sale.completedAt)}</div>}
        description={
          <div className="space-y-1">
            <p className="text-sm">Marked completed by <b>{whoName(completedBy)}</b>.</p>
            <p className="text-sm">Current payment status: <b>{sale.paymentStatus}</b>. Please reconcile payments and update the status if required.</p>
          </div>
        }
      />
    )
  }

  // Approved
  if (sale.status === 'approved') {
    const approvedBy = sale.approvedBy || {}
    return (
      <Alert
        color="success"
        title={<div className="font-semibold">Sale Approved — {formatDateRelative(sale.approvedAt)}</div>}
        description={
          <div className="space-y-1">
            <p className="text-sm">This sale was approved by <b>{whoName(approvedBy)}</b>. You can now proceed to complete the sale.</p>
            <p className="text-sm text-default-400">Payment status: <b>{sale.paymentStatus}</b>.</p>
          </div>
        }
      />
    )
  }

  // Submitted
  if (sale.status === 'submitted') {
    const submittedBy = sale.submittedBy || sale.createdBy || {}
    return (
      <Alert
        color="warning"
        title={<div className="font-semibold">Sale Submitted — {formatDateRelative(sale.submittedAt)}</div>}
        description={
          <div className="space-y-1">
            <p className="text-sm">Submitted by <b>{whoName(submittedBy)}</b>. The sale is awaiting approval from authorised personnel.</p>
            <p className="text-sm text-default-400">You will be notified once the sale is reviewed.</p>
          </div>
        }
      />
    )
  }

  // Draft
  if (sale.status === 'draft') {
    const creator = sale.createdBy || {}
    return (
      <Alert
        title={<div className="font-semibold">Draft Sale</div>}
        description={<div className="space-y-1"><p className="text-sm">This sale is currently a draft created by <b>{whoName(creator)}</b>. Submit when ready for review.</p></div>}
      />
    )
  }

  return null
}


const Header = ({ sale, onOpenChange, refetch }) => {
  const user = useSelector((state) => state.auth.user)

  // use mutation's async helpers for predictable flow
  const { mutateAsync: submitAsync, isPending: submetting } = useSubmitSale()
  const { mutateAsync: approveAsync, isPending: approving } = useApproveSale()
  const { mutateAsync: rejectAsync, isPending: rejecting } = useRejectSale()
  const { mutateAsync: completeAsync, isPending: completing } = useCompleteSale()

  const canApproveOrReject = useMemo(() => user?.data?.activerole !== 'staff', [user])
  // permission checks (hooks must be called at top level)
  const canApprovePerm = useHasPermission(PERMISSION_MODULES.SALES, 'approve')
  const canRejectPerm = useHasPermission(PERMISSION_MODULES.SALES, 'reject')
  const canCompletePerm = useHasPermission(PERMISSION_MODULES.SALES, 'complete')

  const handleSubmit = useCallback(async () => {
    if (submetting) return
    // open confirmation modal
    setConfirmTitle('Submit sale')
    setConfirmMessage('Submit this sale for approval?')
    setConfirmShowReason(false)
    setConfirmPayload({ action: 'submit' })
    setConfirmOpen(true)
  }, [sale?._id, submitAsync, submetting, refetch])

  const handleApprove = useCallback(async () => {
    if (approving) return
    setConfirmTitle('Approve sale')
    setConfirmMessage('Approve this sale?')
    setConfirmShowReason(false)
    setConfirmPayload({ action: 'approve' })
    setConfirmOpen(true)
  }, [sale?._id, approveAsync, approving, refetch])

  const handleReject = useCallback(async () => {
    if (rejecting) return
    // ask for optional reason via modal
    setConfirmTitle('Reject sale')
    setConfirmMessage('Please provide a reason for rejection (optional)')
    setConfirmShowReason(true)
    setConfirmPayload({ action: 'reject' })
    setConfirmOpen(true)
  }, [sale?._id, rejectAsync, rejecting, refetch])

  const handleComplete = useCallback(async () => {
    if (completing) return
    setConfirmTitle('Complete sale')
    setConfirmMessage('Mark this sale as completed?')
    setConfirmShowReason(false)
    setConfirmPayload({ action: 'complete' })
    setConfirmOpen(true)
  }, [sale?._id, completeAsync, completing, refetch])

  // Confirm modal state and handler
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmTitle, setConfirmTitle] = React.useState('')
  const [confirmMessage, setConfirmMessage] = React.useState('')
  const [confirmShowReason, setConfirmShowReason] = React.useState(false)
  const [confirmPayload, setConfirmPayload] = React.useState(null)

  const handleConfirm = React.useCallback(async (reason) => {
    if (!confirmPayload || !confirmPayload.action) {
      setConfirmOpen(false)
      return
    }
    try {
      if (confirmPayload.action === 'submit') {
        await submitAsync(sale._id)
      } else if (confirmPayload.action === 'approve') {
        await approveAsync(sale._id)
      } else if (confirmPayload.action === 'reject') {
        await rejectAsync({ id: sale._id, reason: reason || '' })
      } else if (confirmPayload.action === 'complete') {
        await completeAsync(sale._id)
      }
      refetch?.()
    } catch (err) {
      // toast.error(err?.message || 'Action failed')
    } finally {
      setConfirmOpen(false)
      setConfirmPayload(null)
    }
  }, [confirmPayload, submitAsync, approveAsync, rejectAsync, completeAsync, sale?._id, refetch])

  return (
    <Card className="rounded-lg shadow-sm border border-default p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold ">{sale?.invoiceNo}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">#Order Id : {sale.orderNo}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={sale.status} />
          <PaymentBadge status={sale.paymentStatus} />

          {/* Action buttons: show based on status and role */}
          {sale.status === 'draft' && (
            <Button size="sm" color="secondary" onPress={handleSubmit} disabled={submetting}> {submetting ? 'Submitting...' : 'Submit'} </Button>
          )}

          {sale.status === 'submitted' && canApproveOrReject && (
            <>
              {canApprovePerm && (
                <Button size="sm" color="primary" onPress={handleApprove} disabled={approving}>{approving ? 'Approving...' : 'Approve'}</Button>
              )}
              {canRejectPerm && (
                <Button size="sm" color="danger" variant="solid" onPress={handleReject} disabled={rejecting}>{rejecting ? 'Rejecting...' : 'Reject'}</Button>
              )}
            </>
          )}

          {sale.status === 'approved' && canApproveOrReject && canCompletePerm && (
            <Button size="sm" color="success" onPress={handleComplete} disabled={completing}>{completing ? 'Completing...' : 'Complete'}</Button>
          )}

          {sale?.status == 'completed' && (
            <Button size="sm" variant="flat" onPress={onOpenChange}>
              View as #Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation modal for submit/approve/reject/complete actions */}
      <ConfirmActionModal
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        showReason={confirmShowReason}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </Card>
  )
}

const StatusCards = ({ sale }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <StatCard
      icon={<DollarSign className="w-5 h-5" />}
      label="Grand Total"
      value={`₹${sale.grandTotal.toFixed(2)}`}
      bgColor="bg-blue-50"
      iconColor="text-blue-600"
    />
    <StatCard
      icon={<Package className="w-5 h-5" />}
      label="Total Items"
      value={sale.items.length}
      bgColor="bg-purple-50"
      iconColor="text-purple-600"
    />
    <StatCard
      icon={<Calendar className="w-5 h-5" />}
      label="Created"
      value={new Date(sale.createdAt).toLocaleDateString()}
      bgColor="bg-green-50"
      iconColor="text-green-600"
    />
  </div>
)

const StatCard = ({ icon, label, value, bgColor, iconColor }) => (
  <Card className="rounded-lg shadow-sm border border-default p-6">
    <div className="flex items-center gap-3">
      <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-300">{label}</p>
        <p className="text-2xl font-bold ">{value}</p>
      </div>
    </div>
  </Card>
)

const CustomerInfo = ({ customer }) => (
  <Card className="rounded-lg shadow-sm border border-default p-6">
    <div className="flex items-center gap-2 mb-4">
      <User className="w-5 h-5 text-gray-600" />
      <h2 className="text-xl font-semibold ">Customer Information</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoItem label="Name" value={customer.name} />
      <InfoItem label="Email" value={customer.email} />
      <InfoItem label="Phone" value={customer.phone} />
      <InfoItem label="Company" value={customer.companyName} />
      <InfoItem 
        label="Address" 
        value={`${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.zipCode}, ${customer.address.country}`}
        fullWidth
      />
      {/* <InfoItem label="Credit Limit" value={`₹${customer.creditLimit.toFixed(2)}`} />
      <InfoItem label="Current Balance" value={`₹${customer.currentBalance.toFixed(2)}`} /> */}
    </div>
  </Card>
)

const InfoItem = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? "md:col-span-2" : ""}>
    <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">{label}</p>
    <p className="text-base  font-medium">{value}</p>
  </div>
)

const ItemsTable = ({ items }) => (
  <Card className="rounded-lg shadow-sm border border-default overflow-hidden">
    <div className="p-6 border-b border-default">
      <h2 className="text-xl font-semibold ">Order Items</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-default">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-default transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium ">{item.stockId.productName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{item.stockId.description}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm ">{item.stockId.sku}</td>
              <td className="px-6 py-4 text-sm  text-right">{item.quantity}</td>
              <td className="px-6 py-4 text-sm  text-right">₹{item.price.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm font-medium  text-right">₹{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
)

const PaymentSummary = ({ sale }) => (
  <Card className="rounded-lg shadow-sm border border-default p-6">
    <h2 className="text-xl font-semibold  mb-4">Payment Summary</h2>
    <div className="space-y-3">
      <SummaryRow label="Subtotal" value={sale.subTotal} />
      <SummaryRow 
        label={`Tax (${sale.taxType})`} 
        value={sale.tax} 
      />
      <SummaryRow 
        label={`Discount (${sale.discountType})`} 
        value={-sale.discount} 
        isNegative 
      />
      <div className="border-t border-gray-200 pt-3 mt-3">
        <SummaryRow 
          label="Grand Total" 
          value={sale.grandTotal} 
          isTotal 
        />
      </div>
    </div>
  </Card>
)

const SummaryRow = ({ label, value, isNegative, isTotal }) => (
  <div className="flex justify-between items-center">
    <span className={`${isTotal ? 'text-lg font-semibold' : 'text-sm'} text-gray-600 dark:text-gray-300`}>
      {label}
    </span>
    <span className={`${isTotal ? 'text-xl font-bold' : 'text-sm font-medium'} ${isNegative ? 'text-red-600' : ''}`}>
      ₹{Math.abs(value).toFixed(2)}
    </span>
  </div>
)

const Timeline = ({ sale }) => {
  const { mutate: MarkOrderAsPaid, isPending: markingAsPaid } = useUpdatePaymentStatus()

    const HandleUpdatePayment = async (status, id) => {
      if (markingAsPaid) return;
      await MarkOrderAsPaid({ id, status })
    }
  const events = [
    { label: 'Created', date: sale.createdAt, user: sale.createdBy.name, icon: Clock, color: 'text-default-600 bg-default-100' },
    sale.approvedAt && { label: 'Approved', date: sale.approvedAt, user: sale.approvedBy.name, icon: CheckCircle, color: 'text-success bg-success-50' },
    sale.rejectedAt && { label: 'Rejected', date: sale.rejectedAt, user: sale.rejectedBy.name, icon: AlertCircle, color: 'text-danger bg-danger-50' },
    sale.completedAt && { label: 'Completed', date: sale.completedAt, user: sale.completedBy.name, icon: CheckCircle, color: 'text-success bg-success-50' },
  ].filter(Boolean)

  return (
    <Card className="rounded-lg shadow-sm border border-default p-6">
      <h2 className="text-xl font-semibold  mb-4">Timeline</h2>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <TimelineEvent key={idx} event={event} isLast={idx === events.length - 1} />
        ))}
      </div>
      <RadioGroup label='Payment Status' orientation="horizontal" defaultValue={sale?.paymentStatus || 'unpaid'} isDisabled={sale?.status == 'rejected' || sale?.status == 'draft'}>
        {["unpaid", "partial", "paid"].map(status => (
            <Radio key={status} value={status} onChange={() => HandleUpdatePayment(status, sale?._id)}>{status}</Radio>
        ))}
      </RadioGroup>
    </Card>
  )
}

const TimelineEvent = ({ event, isLast }) => {
  const Icon = event.icon
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${event.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm font-medium ">{event.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
          {new Date(event.date).toLocaleString()} by {event.user}
        </p>
      </div>
    </div>
  )
}

const StatusBadge = ({ status }) => {
  const colors = {
    completed: 'success',
    submitted: 'warning',
    rejected: 'danger',
  }
  return (
    <>
      <Chip size="sm" variant="flat" color={colors[status] || colors.pending}>
        {/* {colors[status]} */}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Chip>
    </>
  )
}

const PaymentBadge = ({ status }) => {
  const colors = {
    paid: 'success',
    unpaid: 'danger',
    partial: 'warning',
  }
  return (
    <Chip size="sm" variant="flat" color={colors[status] || 'default'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Chip>
  )
}

const LoadingState = () => (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto space-y-6">
            {/* Header Skeleton */}
            <Card className="rounded-lg shadow-sm border border-default p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                    </div>
                </div>
            </Card>

            {/* Status Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-lg shadow-sm border border-default p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
                                <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Customer Info Skeleton */}
            <Card className="rounded-lg shadow-sm border border-default p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
                            <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                    ))}
                    <div className="md:col-span-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-full"></div>
                    </div>
                </div>
            </Card>

            {/* Items Table Skeleton */}
            <Card className="rounded-lg shadow-sm border border-default overflow-hidden">
                <div className="p-6 border-b border-default">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-default">
                            <tr>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <th key={i} className="px-6 py-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[1, 2, 3].map((i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-8 ml-auto"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Payment Summary Skeleton */}
            <Card className="rounded-lg shadow-sm border border-default p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-40 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Timeline Skeleton */}
            <Card className="rounded-lg shadow-sm border border-default p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                                {i !== 3 && <div className="w-0.5 h-8 bg-gray-200 mt-2 animate-pulse"></div>}
                            </div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    </div>
)

const ErrorState = ({ error }) => (
  <Card className="min-h-screen rounded-none flex items-center justify-center p-4">
    <div className="rounded-lg shadow-sm border border-default-100 p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <h2 className="text-xl font-semibold ">Error Loading Sale</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-300">{error?.message || 'An unexpected error occurred'}</p>
    </div>
  </Card>
)

const EmptyState = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="text-center">
      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold  mb-2">No Sale Found</h2>
      <p className="text-gray-600">The requested sale could not be found.</p>
    </div>
  </div>
)

export default Index



const InvoiceModal = ({ isOpen, onClose, onOpenChange, sale}) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='4xl' scrollBehavior='inside'>
      <ModalContent>
        {({ onClose }) => (
          <>
            <ModalHeader></ModalHeader>
            <ModalBody>
              <InvoiceFormatter sale={sale} />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}