'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Calendar, Download, Filter } from 'lucide-react'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const ReportsPage = () => {
  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.REPORTS, action: 'read' }} >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-gray-600">View detailed reports and analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="bordered" startContent={<Filter className="w-4 h-4" />}>
              Filter
            </Button>
            <Button color="primary" startContent={<Download className="w-4 h-4" />}>
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-600">$0</h3>
                <p className="text-gray-600">Total Sales</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-600">$0</h3>
                <p className="text-gray-600">Total Purchases</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-600">$0</h3>
                <p className="text-gray-600">Profit</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-orange-600">0</h3>
                <p className="text-gray-600">Transactions</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Sales Report</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">Sales report charts will be implemented here.</p>
                {/* Add your sales report charts here */}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Inventory Report</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">Inventory report charts will be implemented here.</p>
                {/* Add your inventory report charts here */}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </CheckPagePermission>
  )
}

export default ReportsPage