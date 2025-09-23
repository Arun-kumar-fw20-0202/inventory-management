'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Inbox } from 'lucide-react'

const AllSalesPage = () => {
  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Inbox className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">All Transactions</h1>
            <p className="text-gray-600">View all sales transactions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Sales Transactions</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600">Sales transactions table will be implemented here.</p>
              {/* Add your sales transactions table here */}
            </div>
          </CardBody>
        </Card>
      </div>
    </PageAccess>
  )
}

export default AllSalesPage