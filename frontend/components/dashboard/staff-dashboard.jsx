import CustomerInsights from '@/app/(dashboard)/analytics/_components/CustomerInsights'
import RevenueTrends from '@/app/(dashboard)/analytics/_components/RevenueTrends'
import SalesByRegion from '@/app/(dashboard)/analytics/_components/sales-by-regin'
import SummaryCards from '@/app/(dashboard)/analytics/_components/SummaryCards'
import TopProducts from '@/app/(dashboard)/analytics/_components/TopProducts'
import React from 'react'
import { useSelector } from 'react-redux'

const StaffDashboard = () => {
  const [filters, setFilters] = React.useState({ granularity: 'day' })
  const user = useSelector((state) => state.auth.user);
  
  return (
    <div className='flex flex-col gap-4'>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold mr-2">Welcome Back : {user?.data?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Here's a quick overview of your sales performance and activities.
          </p>
        </div>
      </div>
      <SummaryCards params={filters} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* <div className="lg:col-span-3">
          <RevenueTrends params={filters} type='area' 
            title='Your Revenue & Orders Trends'
          />
        </div> */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <SalesByRegion params={filters} />
        </div>

        <div className="space-y-6">
          <TopProducts params={filters} title={"Today's Top Products"} />
          <CustomerInsights params={filters} title={"Today's Top Customers"} />
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard