'use client'
import React, { useMemo } from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { BookOpen } from 'lucide-react'
import { useDisclosure } from '@heroui/modal'
import StockModal from './_components/stock-modal'
import { Button } from '@heroui/button'
import { useAddStock, useUpdateStock } from '@/libs/mutation/stock/stock-mutation'
import StockTable from './_components/stock-table'
import { useFetchStock } from '@/libs/query/stock/stock-query'
import { useRouter } from 'next/navigation'
import { StockSummary } from './_components/stock-summary'

const StockPage = () => {
   const router = useRouter()
   const [bulkSelection, setBulkSelection] = React.useState([]);
   
   const [filter, setFilter] = React.useState({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: '',
      category: null,
      status: null,
      unit: null,
      minPrice: null,
      maxPrice: null,
      lowStock: false,
      includeAnalytics: true,
   })

   const { data: stocks, isLoading: isLoading, refetch: handleRefresh } = useFetchStock({
      ...filter
   })


   // Memoized computed values
   const tableData = useMemo(() => stocks?.data || [], [stocks?.data]);
   const summaryData = useMemo(() => stocks?.analytics?.summary, [stocks?.analytics?.summary]);
   const paginationData = useMemo(() => stocks?.pagination, [stocks?.pagination]);

   
   
   const { isOpen, onOpen, onClose } = useDisclosure()
   const [modalMode, setModalMode] = React.useState('create') // 'create' or 'edit'
   const [selectedStock, setSelectedStock] = React.useState(null)
   
   // Mutations
   const { mutateAsync: addStock, isLoading: addingStock } = useAddStock()
   const { mutateAsync: updateStock, isLoading: updatingStock } = useUpdateStock()


   const handleStockSubmit = async (data) => {
      try {
         if (modalMode === 'create') {
            await addStock(data)
         } else if (modalMode === 'edit' && selectedStock) {
            await updateStock({ 
               id: selectedStock._id, 
               data: data 
            })
         }
         
         // Close modal on success
         onClose()
         
         // Reset state
         setSelectedStock(null)
         setModalMode('create')
         
      } catch (error) {
         // Error is already handled in the mutation hooks
         console.error('Error submitting stock:', error)
         throw error // Re-throw so the modal can handle loading states
      }
   }

   const handleCreateStock = () => {
      setModalMode('create')
      setSelectedStock(null)
      onOpen()
   }

   const handleEditStock = (stockData) => {
      setModalMode('edit')
      setSelectedStock(stockData)
      onOpen()
   }

   const handleCloseModal = () => {
      onClose()
      // Reset state when modal is closed
      setTimeout(() => {
         setSelectedStock(null)
         setModalMode('create')
      }, 300) // Small delay to allow modal close animation
   }
   
   const handleViewStockDetails = (stockData) => {
      // For now, just alerting. Replace with actual view details logic.
      router.push(`/stock/${stockData._id}`)
   }
   
   return (
      <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
         <StockModal
            isOpen={isOpen}
            onClose={handleCloseModal}
            mode={modalMode}
            stockData={selectedStock}
            onSubmit={handleStockSubmit}
         />
         
         <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
               <BookOpen className="w-8 h-8 text-primary" />
               <div>
                  <h1 className="text-3xl font-bold">Stock Management</h1>
                  <p className="text-gray-600">Manage your inventory and stock levels</p>
               </div>
            </div>

            <Card className='shadow-none border border-default-100'>
               <StockTable 
                  onEdit={handleEditStock}
                  tableData={tableData}
                  isLoading={isLoading}
                  paginationData={paginationData}
                  bulkSelection={bulkSelection}
                  setBulkSelection={setBulkSelection}
                  onRefresh={handleRefresh}
                  onAddNew={handleCreateStock}
                  onViewDetails={handleViewStockDetails}
                  // onDelete={handleDeleteStock}
               />
            </Card>
            <div className="mt-5 shadow-none border-default p-4">
               <StockSummary summaryData={summaryData} />
            </div>
         </div>
      </PageAccess>
   )
}

export default StockPage