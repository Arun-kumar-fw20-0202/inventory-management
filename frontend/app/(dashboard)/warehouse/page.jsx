import PageAccess from '@/components/role-page-access'
import { Warehouse } from 'lucide-react'
import React from 'react'
import WarehouseTable from './_components/warehouse-table'

const Index = () => {
   return (
      <PageAccess allowedRoles={['superadmin', 'admin', 'manager']}>
         <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
               <Warehouse className="w-8 h-8 text-primary" />
               <div>
                  <h1 className="text-3xl font-bold">Warehouse</h1>
                  <p className="text-gray-600">Manage your product warehouse</p>
               </div>
            </div>
            <WarehouseTable />
         </div>
      </PageAccess>
   )
}

export default Index