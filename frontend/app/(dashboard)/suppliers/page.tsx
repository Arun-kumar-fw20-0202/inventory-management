'use client'
import React, { useState } from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { User, Plus, TrendingUp, TrendingDown, AlertCircle, Star } from 'lucide-react'
import SupplierCustomerModal from '@/components/supplier-customer-modal'
import SupplierCustomerTable from '@/components/supplier-customer-table'
import { useSupplierCustomerAnalytics } from '@/libs/mutation/suppliser-customer/suppliser-customer-mutation-query'

const SuppliersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch analytics for suppliers
  const { data: analytics, isLoading: analyticsLoading } = useSupplierCustomerAnalytics()

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

  const analyticsData = analytics?.data?.summary || {}

  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager']}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Suppliers</h1>
              <p className="text-gray-600">Manage your suppliers and vendors</p>
            </div>
          </div>
          <Button 
            color="primary" 
            startContent={<Plus className="w-4 h-4" />}
            onClick={handleAddSupplier}
          >
            Add Supplier
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">
                    {analyticsLoading ? '...' : analyticsData.totalContacts || 0}
                  </h3>
                  <p className="text-gray-600">Total Suppliers</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-green-600">
                    {analyticsLoading ? '...' : analyticsData.activeContacts || 0}
                  </h3>
                  <p className="text-gray-600">Active Suppliers</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-orange-600">
                    ${analyticsLoading ? '...' : new Intl.NumberFormat().format(analyticsData.totalPurchases || 0)}
                  </h3>
                  <p className="text-gray-600">Total Purchases</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-purple-600">
                    {analyticsLoading ? '...' : (analyticsData.averageRating || 0).toFixed(1)}
                  </h3>
                  <p className="text-gray-600">Avg Rating</p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardBody>
          </Card>
        </div>

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