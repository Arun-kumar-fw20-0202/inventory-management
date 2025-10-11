'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { useFetchRevenueTrends } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'
import { RevenueTrendsGraph } from "./RevenueTrendsGraph"

const Sparkline = ({ data = [] }) => {
  if (!data.length) return <div className="text-sm text-gray-500">No data</div>
  const max = Math.max(...data.map(d => d.revenue))
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.revenue / max) * 100}`)
  return (
    <svg viewBox="0 0 100 100" className="w-full h-28">
      <polyline fill="none" stroke="#c31d7b" strokeWidth="1.5" points={points.join(' ')} />
    </svg>
  )
}

const RevenueTrends = ({ params = {} }) => {
  const { data, isLoading } = useFetchRevenueTrends(params)
  const series = data?.data?.series || []

    if(isLoading) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Revenue Trends</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2">
                        {Array.from({ length: 1 }).map((_, index) => (
                            <div key={index} className="h-[200px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader className='flex justify-between'>
        <h3 className="text-lg font-semibold">Revenue Trends</h3>
        <div className="mb-2">
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300">Total: {formatCurrency(series.reduce((s, i) => s + (i.revenue || 0), 0))}</div>
        </div>
      </CardHeader>
      <CardBody>
        {/* <Sparkline data={series} /> */}
        {/* {
            "period": "2025-09-29T00:00:00.000Z",
            "revenue": 1000,
            "orders": 1
            }, */}
        <RevenueTrendsGraph 
            chartData={series}
            chartConfig={{
                revenue: {
                    label: "revenue",
                    color: "#de4b01",
                },
                orders: {
                    label: "orders",
                    color: "#f4d109",
                },
            }}
        />
      </CardBody>
    </Card>
  )
}

export default RevenueTrends
