 'use client'
import React from 'react'
import { useApproveSale, useCompleteSale, useFetchSales, useRejectSale, useSubmitSale, useUpdatePaymentStatus } from '@/libs/mutation/sales/sales-mutations'
import SaleFilters from './SaleFilters'
import { OrderCard } from './order-card'
import SalesTable from './SalesTable'
import { Card } from '@heroui/card'

const SalesList = () => {
  const [filters, setFilters] = React.useState({ page: 1, limit: 20 })
  const { data, isLoading, refetch } = useFetchSales(filters)

  const { mutate: SubmitSale, isPending: submetting, isSuccess: submited } = useSubmitSale()
  const { mutate: ApproveSale, isPending: approving, isSuccess: approved } = useApproveSale()
  const { mutate: RejectSale, isPending: rejecting, isSuccess: rejected } = useRejectSale()
  const { mutate: CompleteSale, isPending: completing, isSuccess: completed } = useCompleteSale()
  const { mutate: MarkOrderAsPaid, isPending: markingAsPaid, isSuccess: markedAsPaid } = useUpdatePaymentStatus()

  React.useEffect(() => { refetch() }, [filters])

  const items = data?.data?.items || []
  const total = data?.data?.total || 0
  const totals = data?.data?.totals || { totalSales: 0, revenue: 0 }


  const onPage = (next) => setFilters(prev => ({ ...prev, page: next }))

  const [view, setView] = React.useState('table') // 'cards' | 'table'

  const handleSubmitSale = (orderId) => {
    if (submetting) return;
    SubmitSale(orderId)
  }


  return (
    <div className="space-y-4">
      <SaleFilters 
        onChange={(next) => setFilters(prev => ({ ...prev, page: 1, ...next }))} 
        onChangeMode={(mode) => setView(mode)}  
        mode={view}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">Total: {total} · Sales: {totals.totalSales} · Revenue: {totals.revenue ? totals.revenue.toFixed(2) : 0}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Showing: {items.length}</div>
      </div>


      {view === 'table' ? (
        <SalesTable 
          initialFilters={filters} 
          actions = {{
            SubmitSale,
            submetting,
            ApproveSale,
            approving,
            approved,
            RejectSale,
            rejecting,
            rejected,
            CompleteSale,
            completing,
            completed,
            MarkOrderAsPaid,
            markingAsPaid,
            markedAsPaid
          }}  
        />
      ) : isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <Card className="text-center text-gray-500 min-h-[50vh] flex flex-col justify-center items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          No sales found.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {items.map((order) => (
            <OrderCard key={order._id} order={order} 
              actions = {{
                handleSubmitSale,
                submetting,
                ApproveSale,
                approving,
                approved,
                RejectSale,
                rejecting,
                rejected,
                CompleteSale,
                completing,
                completed,
                MarkOrderAsPaid,
                markingAsPaid,
                markedAsPaid
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SalesList

const LoadingState = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Card key={index} className="p-4">
          <div className="animate-pulse">
            <div className="flex space-x-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}