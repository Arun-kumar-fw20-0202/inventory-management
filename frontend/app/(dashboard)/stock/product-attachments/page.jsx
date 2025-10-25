'use client'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'
import React from 'react'
import AttachmentManager from './_components/AttachmentManager'

const Index = () => {
  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.STOCK, action: 'read' }}>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Product Attachments</h2>
          <AttachmentManager />
        </div>
    </CheckPagePermission>
  )
}

export default Index