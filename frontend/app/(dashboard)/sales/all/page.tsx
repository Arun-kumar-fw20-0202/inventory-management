'use client'
import React from 'react'
import SalesList from './_components/SalesList'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const AllSalesPage = () => {
  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.SALES, action: 'read' }}>
      <div className="p-6">
        <SalesList />
      </div>
    </CheckPagePermission>
  )
}

export default AllSalesPage