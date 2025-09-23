'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { TrendingUp } from 'lucide-react'

const AnalyticsPage = () => {
  return (
    <PageAccess allowedRoles={['superadmin', 'admin']}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Analytics</h1>
              <Chip color="warning" variant="flat" size="sm">Beta</Chip>
            </div>
            <p className="text-gray-600">Advanced analytics and insights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-600">0%</h3>
                <p className="text-gray-600">Growth Rate</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-600">0%</h3>
                <p className="text-gray-600">Profit Margin</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-600">0</h3>
                <p className="text-gray-600">Avg. Order Value</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-orange-600">0%</h3>
                <p className="text-gray-600">Customer Retention</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Revenue Trends</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-600">Revenue trend charts will be implemented here.</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Customer Analytics</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-600">Customer analytics charts will be implemented here.</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Product Performance</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600">Product performance analytics will be implemented here.</p>
              {/* Add your product performance analytics here */}
            </div>
          </CardBody>
        </Card>
      </div>
    </PageAccess>
  )
}

export default AnalyticsPage