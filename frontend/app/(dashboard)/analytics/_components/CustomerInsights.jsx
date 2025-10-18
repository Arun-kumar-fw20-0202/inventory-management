'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { useFetchCustomerInsights } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'

const CustomerInsights = ({ params = {}, title="Top Customers" }) => {
    const { data, isLoading } = useFetchCustomerInsights(params)
    const items = data?.data?.items || []

    if (isLoading) {
      return (
        <Card>
          <CardHeader>
              <h3 className="text-lg font-semibold">{title}</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-2 border border-default rounded flex justify-between items-center animate-pulse">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )
    }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.customerId} className="p-2 border-b border-default flex justify-between items-center">
              <div>
                <div className="font-medium">{c.customer?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">{c.customer?.email}</div>
              </div>
              <div className="text-right text-sm">
                <div>Orders: {c.orders}</div>
                <div>Revenue: {formatCurrency(c.revenue ?? c.revenue)}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-gray-500">No customers found</div>}
        </div>
      </CardBody>
    </Card>
  )
}

export default CustomerInsights
