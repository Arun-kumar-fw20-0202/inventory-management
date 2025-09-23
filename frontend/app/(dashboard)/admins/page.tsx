'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { CreditCard, Plus, Shield, Users } from 'lucide-react'

const AdminsPage = () => {
  return (
    <PageAccess allowedRoles={['superadmin']}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Management</h1>
              <p className="text-gray-600">Manage system administrators and permissions</p>
            </div>
          </div>
          <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
            Add Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">0</h3>
                  <p className="text-gray-600">Total Admins</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">0</h3>
                  <p className="text-gray-600">Active Admins</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-600">0</h3>
                  <p className="text-gray-600">Organizations</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Admin Users</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">Admin users management interface will be implemented here.</p>
                {/* Add your admin users table here */}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Role Permissions</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">Role permissions management will be implemented here.</p>
                {/* Add your role permissions interface here */}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageAccess>
  )
}

export default AdminsPage