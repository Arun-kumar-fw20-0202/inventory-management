'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { BarChart3 } from 'lucide-react'

const NewSalePage = () => {
  return (
    <PageAccess allowedRoles={['superadmin', 'admin', 'manager', 'staff']}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">New Sale</h1>
            <p className="text-gray-600">Create a new sales transaction</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Sales Form</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600">Sales form content will be implemented here.</p>
              {/* Add your sales form components here */}
            </div>
          </CardBody>
        </Card>
      </div>
    </PageAccess>
  )
}

export default NewSalePage