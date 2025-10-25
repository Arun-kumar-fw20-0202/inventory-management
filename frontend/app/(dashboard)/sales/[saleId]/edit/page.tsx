'use client'
import React from 'react'
import SalesForm from '../../new/_components/sales-form'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'
import { useFetchSaleById } from '@/libs/mutation/sales/sales-mutations'

const EditSalePage = ({ params }) => {
  const id = params?.saleId
  const { data: saleData, isLoading } = useFetchSaleById(id)

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  const sAny = saleData as any
  const sale = (sAny && (sAny.data || sAny)) || null

  // Only allow editing if sale.status === 'draft'
  if (sale && sale.status !== 'draft') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Sale cannot be edited</h2>
          <p className="text-gray-500">Only draft sales can be updated.</p>
        </div>
      </div>
    )
  }

  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.SALES, action: 'update' }}>
      <div className="p-6">
        <SalesForm saleId={id} initialSale={sale} />
      </div>
    </CheckPagePermission>
  )
}

export default EditSalePage
