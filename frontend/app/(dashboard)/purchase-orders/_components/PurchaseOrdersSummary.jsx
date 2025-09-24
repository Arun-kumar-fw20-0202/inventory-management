'use client'
import React from 'react'
import { Card, CardBody } from '@heroui/card'
import { useFetchPurchaseOrdersSummary } from '@/libs/mutation/purchase-order/purchase-order-mutation'
import { formatCurrency } from '@/libs/utils'

const PurchaseOrdersSummary = () => {
  const { data: summaryResponse, isLoading, error } = useFetchPurchaseOrdersSummary()

  const summary = summaryResponse || {
    draft: 0,
    pending: 0,
    approved: 0,
    completed: 0
  }

  const totalOrders = summary.draft + summary.pending + summary.approved + summary.completed

  const summaryCards = [
    {
      title: 'Total Orders',
      value: totalOrders,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pending Approval',
      value: summary.pending,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Approved',
      value: summary.approved,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Completed',
      value: summary.completed,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardBody>
              <div className="text-center animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardBody>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-400">--</h3>
                <p className="text-gray-600">{card.title}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardBody>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${card.bgColor} mb-3`}>
                <span className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </span>
              </div>
              <h3 className={`text-2xl font-bold ${card.color} mb-1`}>
                {card.value}
              </h3>
              <p className="text-gray-600 text-sm">{card.title}</p>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

export default PurchaseOrdersSummary