import React from 'react'
import PricingList from './_components/pricing-list'
import CheckPagePermission from '@/components/check-page-permissoin'
import { PERMISSION_MODULES } from '@/libs/utils'

const Index = () => {
  return (
    <div className="p-5">
      <CheckPagePermission allowPermission={{ module: PERMISSION_MODULES.PRICING, action: 'read' }} >
        {/* <div className="mb-6">
          <h1 className="text-2xl font-bold">Pricing Plans</h1>
          <p className="text-gray-600 dark:text-gray-300">Choose the plan that best fits your needs</p>
        </div> */}
        <PricingList />
      </CheckPagePermission>
    </div>
  )
}

export default Index