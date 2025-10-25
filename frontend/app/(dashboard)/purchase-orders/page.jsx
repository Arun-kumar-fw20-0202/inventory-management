'use client'
import React, { useState } from 'react'
import PageAccess from '@/components/role-page-access'
import { Button } from '@heroui/button'
import { BookOpen, Plus } from 'lucide-react'
import PurchaseOrdersTable from './_components/PurchaseOrdersTable'
import { useRouter } from 'next/navigation'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'
import { useHasPermission } from '@/libs/utils/check-permission'

const PurchaseOrdersPage = () => {
  const router = useRouter()

  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.PURCHASES, action: 'read' }} >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Purchase Orders</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage purchase orders and procurement</p>
            </div>
          </div>
          {useHasPermission(PERMISSION_MODULES.PURCHASES, 'create') && (
            <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => router.push('/create-order')}>Create Purchase Order</Button>
          )}
        </div>

        {/* Summary Cards */}
        {/* <PurchaseOrdersSummary /> */}

        {/* Purchase Orders Table */}
        <PurchaseOrdersTable />

        {/* Create Purchase Order Modal */}
        {/* <CreatePurchaseOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        /> */}
      </div>
    </CheckPagePermission>
  )
}

export default PurchaseOrdersPage