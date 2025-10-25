'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Settings, Save, User, Bell, Shield, Database } from 'lucide-react'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const SettingsPage = () => {
  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.SETTINGS, action: 'read' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-gray-600">Manage system settings and configurations</p>
            </div>
          </div>
          <Button color="primary" startContent={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Profile Settings</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">User profile and account settings will be implemented here.</p>
                {/* Add your profile settings form here */}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Notifications</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">Notification preferences will be implemented here.</p>
                {/* Add your notification settings here */}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Security</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">Security and privacy settings will be implemented here.</p>
                {/* Add your security settings here */}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <h2 className="text-xl font-semibold">System Settings</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-600">System configuration settings will be implemented here.</p>
                {/* Add your system settings here */}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Organization Settings</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <p className="text-gray-600">Organization-wide settings and configurations will be implemented here.</p>
              {/* Add your organization settings here */}
            </div>
          </CardBody>
        </Card>
      </div>
    </CheckPagePermission>
  )
}

export default SettingsPage