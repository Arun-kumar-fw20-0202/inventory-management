import PageAccess from '@/components/role-page-access'
import { BookOpen } from 'lucide-react'
import React from 'react'
import CategoryTable from './_components/category-table'

const Index = () => {
   return (
      <PageAccess allowedRoles={['superadmin', 'admin', 'manager']}>
         <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
               <BookOpen className="w-12 h-12 text-primary" />
               <div>
                  <h1 className="text-3xl font-bold">Categories</h1>
                  <p className="text-gray-600 dark:text-gray-300">Manage your product categories</p>
               </div>
            </div>
            <CategoryTable />
         </div>
      </PageAccess>
   )
}

export default Index