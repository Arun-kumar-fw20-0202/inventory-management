'use client'
import React, { useState } from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { User, Plus,  } from 'lucide-react'
import SupplierCustomerModal from '@/components/supplier-customer-modal'
import SupplierCustomerTable from '@/components/supplier-customer-table'
import CustomerSupplierSummery from '@/components/customer-supplier-summery'

const SuppliersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAddSupplier = () => {
    setEditData(null)
    setIsModalOpen(true)
  }

  const handleEditSupplier = (supplier: any) => {
    setEditData(supplier)
    setIsModalOpen(true)
  }

  const handleViewSupplier = (supplier: any) => {
    // TODO: Implement supplier detail view
    console.log('View supplier:', supplier)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditData(null)
    // Trigger refresh of the table
    setRefreshTrigger(prev => prev + 1)
  }


  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager']}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Suppliers</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your suppliers and vendors</p>
            </div>
          </div>
          <Button 
            color="primary" 
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleAddSupplier}
          >
            Add Supplier
          </Button>
        </div>

        {/* Analytics Cards */}
        <CustomerSupplierSummery type="supplier" />

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Suppliers List</h2>
          </CardHeader>
          <CardBody>
            <SupplierCustomerTable
              type="supplier"
              onEdit={handleEditSupplier}
              onView={handleViewSupplier}
              refreshTrigger={refreshTrigger}
            />
          </CardBody>
        </Card>

        {/* Add/Edit Modal */}
        <SupplierCustomerModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          editData={editData}
          defaultType="supplier"
        />
      </div>
    </PageAccess>
  )
}

export default SuppliersPage