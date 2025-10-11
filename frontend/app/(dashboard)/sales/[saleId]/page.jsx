'use client'
import { useFetchSaleById } from '@/libs/mutation/sales/sales-mutations'
import React from 'react'
import { Package, User, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card } from '@heroui/card'
import { Button } from '@heroui/button'
import PageAccess from '@/components/role-page-access'
import { useSelector } from 'react-redux'
import { InvoiceFormatter } from '@/components/invoice'
import { Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from '@heroui/modal'

const Index = (saleId) => {
  const id = saleId?.params?.saleId
  const { data: saleData, isLoading, error } = useFetchSaleById(id)
  const {isOpen, onOpen, onOpenChange} = useDisclosure()

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (!saleData?.data) {
    return <EmptyState />
  }

  const sale = saleData.data

  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className=" mx-auto space-y-6">
          <InvoiceModal 
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            sale={sale}
          />
          {/* Header */}
          <Header sale={sale} onOpenChange={onOpenChange} />

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
    </PageAccess>
  )
}

const Header = ({ sale, onOpenChange }) => (
  <Card className="rounded-lg shadow-sm border border-default p-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold ">{sale.orderNo}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organization: {sale.orgNo}</p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={sale.status} />
        <PaymentBadge status={sale.paymentStatus} />
        <Button size="sm" variant="flat" onPress={onOpenChange}>
          View as #Invoice
        </Button>
      </div>
    </div>
  </Card>
)

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
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
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
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-default transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium ">{item.stockId.productName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.stockId.description}</p>
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
    <span className={`${isTotal ? 'text-lg font-semibold' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
      {label}
    </span>
    <span className={`${isTotal ? 'text-xl font-bold' : 'text-sm font-medium'} ${isNegative ? 'text-red-600' : ''}`}>
      ₹{Math.abs(value).toFixed(2)}
    </span>
  </div>
)

const Timeline = ({ sale }) => {
  const events = [
    { label: 'Created', date: sale.createdAt, user: sale.createdBy.name, icon: Clock },
    sale.approvedAt && { label: 'Approved', date: sale.approvedAt, user: sale.approvedBy.name, icon: CheckCircle },
    sale.completedAt && { label: 'Completed', date: sale.completedAt, user: sale.completedBy.name, icon: CheckCircle },
  ].filter(Boolean)

  return (
    <Card className="rounded-lg shadow-sm border border-default p-6">
      <h2 className="text-xl font-semibold  mb-4">Timeline</h2>
      <div className="space-y-4">
        {events.map((event, idx) => (
          <TimelineEvent key={idx} event={event} isLast={idx === events.length - 1} />
        ))}
      </div>
    </Card>
  )
}

const TimelineEvent = ({ event, isLast }) => {
  const Icon = event.icon
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm font-medium ">{event.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {new Date(event.date).toLocaleString()} by {event.user}
        </p>
      </div>
    </div>
  )
}

const StatusBadge = ({ status }) => {
  const colors = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const PaymentBadge = ({ status }) => {
  const colors = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    unpaid: 'bg-orange-100 text-orange-800 border-orange-200',
    partial: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.unpaid}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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
      <p className="text-gray-600 dark:text-gray-400">{error?.message || 'An unexpected error occurred'}</p>
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