'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { useFetchProfitMargins } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'

const ProfitMargins = ({ params = {} }) => {
  const { data, isLoading } = useFetchProfitMargins(params)
  const payload = data?.data || {}

    if(isLoading) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Profit & Margin</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Profit & Margin</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          <div className="flex justify-between text-danger"><span>Total Revenue</span><span>{formatCurrency(payload.totalRevenue || 0)}</span></div>
          <div className="flex justify-between text-warning"><span>Total COGS</span><span>{formatCurrency(payload.totalCOGS || 0)}</span></div>
          <div className="flex justify-between font-bold text-success"><span>Profit</span><span>{formatCurrency(payload.profit || 0)}</span></div>
          <div className="flex justify-between"><span>Margin</span><span>{(payload.margin || 0).toFixed?.(2) ?? payload.margin}%</span></div>
        </div>
      </CardBody>
    </Card>
  )
}

export default ProfitMargins
