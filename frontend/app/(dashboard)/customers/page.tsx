// @ts-nocheck
'use client'
import React, { useState } from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { User, Plus, TrendingUp, TrendingDown, Star, Calendar } from 'lucide-react'
import SupplierCustomerModal from '@/components/supplier-customer-modal'
import SupplierCustomerTable from '@/components/supplier-customer-table'
import CustomerSupplierSummery from '@/components/customer-supplier-summery'
import { useSelector } from 'react-redux'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const CustomersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const user = useSelector((state) => state.auth.user);

  const handleAddCustomer = () => {
    setEditData(null)
    setIsModalOpen(true)
  }

  const handleEditCustomer = (customer: any) => {
    setEditData(customer)
    setIsModalOpen(true)
  }

  const handleViewCustomer = (customer: any) => {
    // TODO: Implement customer detail view
    console.log('View customer:', customer)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditData(null)
    // Trigger refresh of the table
    setRefreshTrigger(prev => prev + 1)
  }


  return (
    <>
      <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.CUSTOMER, action: 'read' }} >
        <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-12 h-12 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Customers</h1>
                  <p className="text-gray-600 dark:text-gray-300">Manage your customers and clients</p>
                </div>
              </div>
              <Button 
                color="primary" 
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleAddCustomer}
              >
                Add Customer
              </Button>
            </div>
            {user?.data?.activerole !== 'staff' && (
              <CustomerSupplierSummery type="customer" />  
            )}
          {/* Customers Table */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Customers List</h2>
              </CardHeader>
              <CardBody>
                <SupplierCustomerTable
                  type={'customer'}
                  onEdit={handleEditCustomer}
                  onView={handleViewCustomer}
                  refreshTrigger={refreshTrigger}
                />
              </CardBody>
            </Card>

            {/* Add/Edit Modal */}
            <SupplierCustomerModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              editData={editData}
              defaultType="customer"
            />
          </div>
        </PageAccess>
      </CheckPagePermission>
    </>
  )
}

export default CustomersPage