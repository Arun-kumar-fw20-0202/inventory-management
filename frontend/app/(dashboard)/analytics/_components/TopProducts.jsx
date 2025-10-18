'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { formatCurrency } from '@/libs/utils'
import { useFetchTopSellingProducts } from '@/libs/mutation/analytics/analytics-mutations'

const TopProducts = ({ params = {}, title='Top Products' }) => {
  const { data, isLoading } = useFetchTopSellingProducts(params)
  const items = data?.data?.items || []

    if(isLoading) {
        return (
            <Card>
              <CardHeader>
                  <h3 className="text-lg font-semibold">{title}</h3>
              </CardHeader>
              <CardBody>
                  <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border-b border-default">
                              <div>
                                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1 w-32"></div>
                                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                              </div>
                              <div className="text-right">
                                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 w-16"></div>
                                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
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
          {items.map((p) => (
            <div key={p?.productId} className="flex justify-between items-center p-2 border-b border-default">
              <div>
                <div className="font-medium">{p?.productName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">SKU: {p?.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Qty: {p?.quantity} {p?.unit}</div>
                <div className="text-sm text-success">{formatCurrency(p?.revenue)}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-gray-500">No products found</div>}
        </div>
      </CardBody>
    </Card>
  )
}

export default TopProducts
