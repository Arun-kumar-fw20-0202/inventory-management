'use client'
import React from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { useFetchInventoryTurnover } from '@/libs/mutation/analytics/analytics-mutations'
import { formatCurrency } from '@/libs/utils'

const InventoryTurnover = ({ params = {} }) => {
    const { data, isLoading } = useFetchInventoryTurnover(params)
    const payload = data?.data || {}

    if(isLoading){
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Inventory Turnover</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Inventory Turnover</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          <div className="text-sm">Total Cost Of Good Sale {"( COGS )"}: <span className="text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(payload.totalCOGS) ?? '-'}</span></div>
          <div className="text-sm">Avg Inventory Value: <span className="text-green-600 dark:text-green-400 font-medium">{payload.avgInventoryValue ?? '-'}</span></div>
          <div className="text-sm font-bold">Turnover: <span className="text-purple-600 dark:text-purple-400">{payload.turnover?.toFixed?.(2) ?? payload.turnover ?? '-'}</span></div>
        </div>
      </CardBody>
    </Card>
  )
}

export default InventoryTurnover
