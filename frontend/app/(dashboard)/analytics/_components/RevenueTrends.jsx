'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { useFetchRevenueTrends } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'
import { RevenueTrendsGraph } from "./RevenueTrendsGraph"
import { RevenueTrendsBarGraph } from './revenue-trends-bar-graph'

const RevenueTrends = ({ params = {}, type='area', title='Revenue Trends' }) => { //  type --> area | bar
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
        <h3 className="text-lg font-semibold">{title}</h3>
        {/* <div className="mb-2">
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300">Total: {formatCurrency(series.reduce((s, i) => s + (i.revenue || 0), 0))}</div>
        </div> */}
      </CardHeader>
      <CardBody>
        {type == 'area' && (
          <RevenueTrendsGraph 
            chartData={series}
            chartConfig={{
              revenue: { label: "revenue", color: "#c31d7b" },
              orders: { label: "orders", color: "#f4d109" },
            }}
          />
        )}

        {type == 'bar' && (
          <RevenueTrendsBarGraph 
            chartData={series}
            chartConfig={{
              revenue: { label: "revenue", color: "#c31d7b" },
              orders: { label: "orders", color: "#f4d109" },
            }}
          />
        )}
      </CardBody>
    </Card>
  )
}

export default RevenueTrends
