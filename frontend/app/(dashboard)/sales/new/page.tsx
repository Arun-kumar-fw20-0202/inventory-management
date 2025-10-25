'use client'
import React from 'react'
import SalesForm from './_components/sales-form'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const NewSalePage = () => {
  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.SALES, action: 'create' }}>
      <div className="p-6">
        <SalesForm />
      </div>
    </CheckPagePermission>
  )
}

export default NewSalePage