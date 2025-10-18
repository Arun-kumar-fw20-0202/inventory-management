'use client'
import React from 'react'
import { 
  Package, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  AlertTriangle, 
  XCircle,
  Percent,
  ShoppingCart,
  ArrowUp
} from 'lucide-react'
import { Card } from '@heroui/card'

const InventoryStats = ({ data }) => {

  const stats = [
    {
      id: 1,
      label: 'Total Items',
      value: data?.totalItems,
      icon: Package,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      id: 2,
      label: 'Total Quantity',
      value: data?.totalQuantity,
      icon: Layers,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
    },
    {
      id: 3,
      label: 'Total Value',
      value: `₹${Number(data?.totalValue).toFixed(0)}`,
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-100',
      highlight: true,
    },
    {
      id: 4,
      label: 'Total Cost',
      value: `₹${Number(data?.totalCost).toFixed(0)}`,
      icon: ShoppingCart,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-100'
    },
    {
      id: 5,
      label: 'Average Price',
      value: `₹${Number(data?.averagePrice).toFixed(0)}`,
      icon: Tag,
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-100'
    },
    {
      id: 6,
      label: 'Total Profit',
      value: `₹${Number(data?.totalProfit).toFixed(0) || 0}`,
      icon: TrendingUp,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
      highlight: true
    },
    {
      id: 7,
      label: 'Profit Margin',
      value: `${data?.profitMargin || 0}%`,
      icon: Percent,
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-100'
    },
    {
      id: 8,
      label: 'Low Stock Items',
      value: data?.lowStockCount,
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-100',
      alert: data?.lowStockCount > 0
    },
    {
      id: 9,
      label: 'Out of Stock',
      value: data?.outOfStockCount,
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-100',
      alert: data?.outOfStockCount > 0
    }
  ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard 
            key={stat?.id} 
            stat={stat} 
            hint={stat?.hint ? stat?.hint : ''}
          />
        ))}
      </div>
    )
}

const StatCard = ({ stat, hint }) => {
  const Icon = stat.icon
  
  return (
    <Card className={`rounded shadow-sm border border-default-100 transition-all duration-300 hover:shadow-md `}>
      <div className="flex items-start justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{stat.label}</p>
            {stat?.alert && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                Alert
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className={`${stat.bgColor} ${stat.iconColor} p-3 rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Card>
  )
}


// Example usage with your data
export const StockSummary = ({summaryData}) => {
  return <InventoryStats data={summaryData} />
}
