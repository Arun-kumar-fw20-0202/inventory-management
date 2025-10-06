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

const AnalyticsPage = () => {
  const [filters, setFilters] = React.useState({ granularity: 'day' })

  return (
    <PageAccess allowedRoles={['superadmin', 'admin']}>
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
          <div className="lg:col-span-2">
            <RevenueTrends params={filters} />
            <div className="mt-6">
              <TopProducts params={filters} />
            </div>
          </div>

          <div className="space-y-6">
            <CustomerInsights params={filters} />
            <InventoryTurnover params={filters} />
            <ProfitMargins params={filters} />
          </div>
        </div>
      </div>
    </PageAccess>
  )
}

export default AnalyticsPage