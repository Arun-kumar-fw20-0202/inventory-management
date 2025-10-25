import { BookOpen } from 'lucide-react'
import React from 'react'
import CategoryTable from './_components/category-table'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const Index = () => {
   return (
      <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.CATEGORY, action: 'read' }} >
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
      </CheckPagePermission>
   )
}

export default Index