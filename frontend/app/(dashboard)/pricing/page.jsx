import React from 'react'
import PricingList from './_components/pricing-list'

const Index = () => {
  return (
    <div className="p-5">
      {/* <div className="mb-6">
        <h1 className="text-2xl font-bold">Pricing Plans</h1>
        <p className="text-gray-600 dark:text-gray-300">Choose the plan that best fits your needs</p>
      </div> */}
      <PricingList />
    </div>
  )
}

export default Index