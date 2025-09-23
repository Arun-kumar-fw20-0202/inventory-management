'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { BookOpen, Plus } from 'lucide-react'

const PurchaseOrdersPage = () => {
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
          <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
            Create Purchase Order
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-600">0</h3>
                <p className="text-gray-600">Total Orders</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-yellow-600">0</h3>
                <p className="text-gray-600">Pending</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-600">0</h3>
                <p className="text-gray-600">Completed</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-600">$0</h3>
                <p className="text-gray-600">Total Value</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600">Purchase orders management interface will be implemented here.</p>
              {/* Add your purchase orders table/list here */}
            </div>
          </CardBody>
        </Card>
      </div>
    </PageAccess>
  )
}

export default PurchaseOrdersPage