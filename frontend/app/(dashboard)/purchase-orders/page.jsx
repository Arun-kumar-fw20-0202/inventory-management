'use client'
import React, { useState } from 'react'
import PageAccess from '@/components/role-page-access'
import { Button } from '@heroui/button'
import { BookOpen, Plus } from 'lucide-react'
import PurchaseOrdersSummary from './_components/PurchaseOrdersSummary'
import PurchaseOrdersTable from './_components/PurchaseOrdersTable'
import CreatePurchaseOrderModal from './_components/CreatePurchaseOrderModal'
// import { useFetchSuppliers } from '@/libs/query/suppliers/suppliers-query'
// import { useFetchWarehouses } from '@/libs/query/warehouses/warehouses-query'
// import { useFetchProducts } from '@/libs/query/products/products-query'

const PurchaseOrdersPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch data for dropdowns
  const { data: suppliers = [], isLoading: suppliersLoading } = {}
  const { data: warehouses = [], isLoading: warehousesLoading } = {}
  const { data: products = [], isLoading: productsLoading } = {}

  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager']}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Purchase Orders</h1>
              <p className="text-gray-600">Manage purchase orders and procurement</p>
            </div>
          </div>
          <Button 
            color="primary" 
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsCreateModalOpen(true)}
            isLoading={suppliersLoading || warehousesLoading || productsLoading}
          >
            Create Purchase Order
          </Button>
        </div>

        {/* Summary Cards */}
        <PurchaseOrdersSummary />

        {/* Purchase Orders Table */}
        <PurchaseOrdersTable />

        {/* Create Purchase Order Modal */}
        <CreatePurchaseOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          suppliers={suppliers}
          warehouses={warehouses}
          products={products}
        />
      </div>
    </PageAccess>
  )
}

export default PurchaseOrdersPage