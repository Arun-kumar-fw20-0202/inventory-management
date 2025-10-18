// @ts-nocheck
'use client'
import React from 'react'
import PageAccess from '@/components/role-page-access'
import { Chip } from '@heroui/chip'
import { TrendingUp } from 'lucide-react'
import FiltersBar from './_components/FiltersBar'
import SummaryCards from './_components/SummaryCards'
import RevenueTrends from './_components/RevenueTrends'
import TopProducts from './_components/TopProducts'
import CustomerInsights from './_components/CustomerInsights'
import InventoryTurnover from './_components/InventoryTurnover'
import ProfitMargins from './_components/ProfitMargins'
import SalesByRegin from './_components/sales-by-regin'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const AnalyticsPage = () => {
  const [filters, setFilters] = React.useState({ granularity: 'day' })

  return (
    <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.REPORTS, action: 'read' }} >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Analytics</h1>
              <Chip color="warning" variant="flat" size="sm">Beta</Chip>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Advanced analytics and insights</p>
          </div>
        </div>

        <FiltersBar filters={filters} onChange={(next) => setFilters(next)} />

        <div className="mb-6">
          <SummaryCards params={filters} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-3">
            <RevenueTrends params={filters} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-3">
            <TopProducts params={filters} />
            <SalesByRegin params={filters} />
          </div>

          <div className="space-y-6">
            <CustomerInsights params={filters} />
            <InventoryTurnover params={filters} />
            <ProfitMargins params={filters} />
          </div>
        </div>
      </div>
    </CheckPagePermission>
  )
}

export default AnalyticsPage