 'use client'
import React, { useMemo } from 'react'
import { useApproveSale, useCompleteSale, useFetchSales, useRejectSale, useSubmitSale, useUpdatePaymentStatus } from '@/libs/mutation/sales/sales-mutations'
import SaleFilters from './SaleFilters'
import { OrderCard } from './order-card'
import SalesTable from './SalesTable'
import { Card } from '@heroui/card'
import { Pagination } from '@heroui/pagination'
import SupplierCustomerAutocomplete from '@/components/dynamic/supplier-customer/supplier-customer-autocomplete'
import { formatNumberShort } from '@/libs/utils'
import { useSelector } from 'react-redux'
import UsersAutocomplete from '@/components/dynamic/user-autocomplete'

const SalesList = () => {
  const [filters, setFilters] = React.useState({ page: 1, limit: 20 })
  const { data, isLoading, refetch } = useFetchSales(filters)
  const activerole = useSelector((state) => state.auth.user?.data?.activerole);
  
  const paginationData = useMemo(() => data?.data?.pagination , [data])

  const { mutate: SubmitSale, isPending: submetting, isSuccess: submited } = useSubmitSale()
  const { mutate: ApproveSale, isPending: approving, isSuccess: approved } = useApproveSale()
  const { mutate: RejectSale, isPending: rejecting, isSuccess: rejected } = useRejectSale()
  const { mutate: CompleteSale, isPending: completing, isSuccess: completed } = useCompleteSale()
  const { mutate: MarkOrderAsPaid, isPending: markingAsPaid, isSuccess: markedAsPaid } = useUpdatePaymentStatus()

  React.useEffect(() => { refetch() }, [filters])

  const items = data?.data?.items || []
  const totals = data?.data?.totals || { totalSales: 0, revenue: 0 }

  const [view, setView] = React.useState('table') // 'cards' | 'table'

  const handleSubmitSale = (orderId) => {
    if (submetting) return;
    SubmitSale(orderId)
  }

  const bottomContent = (
    <div className='flex overflow-hidden items-center justify-between'>
      <Pagination color="primary" isCompact page={paginationData?.page} total={paginationData?.totalPages} onChange={(next) => setFilters(prev => ({ ...prev, page: next }))} showControls />
      <select onChange={(e) => 
        setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))} value={filters.limit} className='max-w-xs p-1 px-3 border border-default-100'>
        {[2,10, 20, 50, 100].map(l => (
            <option className='dark:text-black' key={l} value={l}>{l}</option>
        ))}
      </select>
    </div>
  )

  const topContent = (
    <div className="flex justify-between flex-wrap gap-4">
      <div className="">
        <div>
          <span className="text-2xl font-bold">All Transactions</span>
          <span className="text-gray-600 dark:text-gray-400"> · View all sales transactions</span>
        </div>
        <p className="text-sm">Total Sales: {totals.totalSales} · Revenue: {totals.revenue ? formatNumberShort(totals.revenue) : 0}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Showing: {items.length}</p>
      </div>
      <div className='flex gap-3'>
        <SupplierCustomerAutocomplete 
          variant='bordered'
          className='mx-w-xs'
          label='customer/supplier'
          placeholder="Select Customer"
          type='both' 
          onSelectChange={(c) => setCustomer(c)} 
          key={filters?.customerId}
          defaultSelectedKey={filters?.customerId}
          userData={(data) => setFilters({...filters, customerId: data?._id || null, page: 1})}
        />

        {activerole === 'admin' && (
          <UsersAutocomplete 
            className='mx-w-xs'
            variant='bordered'
            label='Select User'
            defaultSelectedKey={filters?.creatorId}
            key={filters?.creatorId}
            
            placeholder="Filter with Creator"
            onSelectChange={(id) => setFilters({...filters, creatorId: id || null, page: 1})}
          />
        )}
      </div>
    </div>
  )
  

  return (
    <div className="space-y-4">
      <SaleFilters 
        onChange={(next) => setFilters(prev => ({ ...prev, page: 1, ...next }))} 
        onChangeMode={(mode) => setView(mode)}  
        mode={view}
      />

      {view === 'table' ? (
        <SalesTable 
          topContent={topContent}
          bottomContent={bottomContent}
          data={data}
          isLoading={isLoading}
          refetch={refetch}
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
      ) :  (
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