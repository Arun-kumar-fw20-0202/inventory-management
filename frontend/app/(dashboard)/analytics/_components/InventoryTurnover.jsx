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
                    <h3 className="text-lg font-semibold">Inventory Turnover</h3>
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
        <h3 className="text-lg font-semibold">Inventory Turnover</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          <div className="text-sm">Total Cost Of Good Sale {"( COGS )"}: {formatCurrency(payload.totalCOGS) ?? '-'}</div>
          <div className="text-sm">Avg Inventory Value: {payload.avgInventoryValue ?? '-'}</div>
          <div className="text-sm font-bold">Turnover: {payload.turnover?.toFixed?.(2) ?? payload.turnover ?? '-'}</div>
        </div>
      </CardBody>
    </Card>
  )
}

export default InventoryTurnover
