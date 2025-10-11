'use client'
import React from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Truck, Warehouse, IndianRupee, Package, Calendar, NotebookPen, User } from 'lucide-react'
import PurchaseOrderStatusBadge from './PurchaseOrderStatusBadge'
import { formatCurrency, formatDate } from '@/libs/utils'

export default function PurchaseOrdersCardView({
  orders = [],
  isLoading = false,
  pagination = {},
  onViewDetails,
  getActionButtons,
  onPageChange,
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No purchase orders found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-3">
        {orders.map((order) => (
          <Card
            key={order._id}
            className="group relative rounded-2xl shadow-none overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <CardHeader className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {order.orderNumber}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">{order.supplierId?.name}</span>
                </div>
              </div>
              <PurchaseOrderStatusBadge status={order.status} />
            </CardHeader>

            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-default dark:bg-gray-800 transition-colors">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Warehouse</p>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{order.warehouseId?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{order.warehouseId?.location}</p>
                  </div>
                </div>

                <div className="flex items-start bg-foreground-100 gap-3 p-3 rounded-xl bg-default transition-colors">
                  <div className="p-2 bg-background rounded-lg shadow-sm">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-0.5">Created By</p>
                    <p className="font-semibold  truncate">{order.createdBy?.name}</p>
                    <p className="text-xs ">{order.createdBy?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 bg-success-50 rounded-xl">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Amount</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm truncate">{formatCurrency(order.totalAmount, 'INR')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-xl">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Items</p>
                      <p className="font-bold text-primary text-sm">{order.items?.length} Item{order?.items?.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-xl">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Calendar className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Expected Delivery</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'Not set'}</p>
                  </div>
                </div>

                {order?.notes && (
                  <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm self-start">
                      <NotebookPen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{order.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>

            <CardFooter className=''>
              <div className="flex flex-wrap gap-2">
                {getActionButtons(order)}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
          </p>

          <div className="flex gap-2">
            <Button variant="flat" size="sm" onPress={() => onPageChange(pagination.currentPage - 1)} isDisabled={!pagination.hasPrevPage}>Previous</Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button key={page} variant={pagination.currentPage === page ? "solid" : "flat"} size="sm" onPress={() => onPageChange(page)}>{page}</Button>
                )
              })}
            </div>
            <Button variant="flat" size="sm" onPress={() => onPageChange(pagination.currentPage + 1)} isDisabled={!pagination.hasNextPage}>Next</Button>
          </div>
        </div>
      )}
    </>
  )
}
